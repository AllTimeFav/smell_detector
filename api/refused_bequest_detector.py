import os
import sys
import argparse
from typing import Dict, List, Any, Optional, Tuple, Set
import tree_sitter_cpp
from tree_sitter import Language, Parser, Query, QueryCursor, Node

# Tree-sitter query strings extracted into named constants as required
CLASS_DEFINITION_QUERY = """
[
  (class_specifier
    name: (type_identifier) @class_name
    (base_class_clause
      (type_identifier) @base_class_name
    )?
  ) @class_node
  (struct_specifier
    name: (type_identifier) @class_name
    (base_class_clause
      (type_identifier) @base_class_name
    )?
  ) @class_node
]
"""

METHOD_QUERY = """
[
  (field_declaration
    declarator: (function_declarator) @func_decl
  ) @method_node
  (function_definition
    declarator: (function_declarator) @func_decl
  ) @method_node
]
"""

OUT_OF_CLASS_DEF_QUERY = """
(function_definition) @func_def
"""


def get_short_name(name: str) -> str:
    """Extracts the base class name, stripping namespace prefixes."""
    if not name:
        return ""
    return name.split("::")[-1]


def find_function_declarator(node: Node) -> Optional[Node]:
    """Helper to recursively search for the function_declarator node."""
    if node.type == 'function_declarator':
        return node
    for child in node.children:
        res = find_function_declarator(child)
        if res:
            return res
    return None


def has_override_specifier(method_node: Node) -> bool:
    """Checks if a method declaration/definition contains the override specifier."""
    func_decl = find_function_declarator(method_node)
    if not func_decl:
        return False
    for child in func_decl.children:
        if child.type == 'virtual_specifier':
            if child.text.decode('utf-8') == 'override':
                return True
    return False


def find_qualified_identifier(node: Node) -> Optional[Node]:
    """Recursively searches for a qualified_identifier in a declarator."""
    if node.type == 'qualified_identifier':
        return node
    for child in node.children:
        res = find_qualified_identifier(child)
        if res:
            return res
    return None


def parse_qualified_identifier(node: Node) -> List[str]:
    """Parses qualified_identifier components (e.g. Namespace::Class::method -> ['Namespace', 'Class', 'method'])."""
    if node.type == 'qualified_identifier':
        parts = []
        for child in node.children:
            if child.type in ('namespace_identifier', 'type_identifier', 'identifier', 'destructor_name'):
                parts.append(child.text.decode('utf-8'))
            elif child.type == 'qualified_identifier':
                parts.extend(parse_qualified_identifier(child))
        return parts
    elif node.type in ('namespace_identifier', 'type_identifier', 'identifier', 'destructor_name'):
        return [node.text.decode('utf-8')]
    return []


def get_method_name(method_node: Node) -> str:
    """Extracts the method name identifier from a method declaration or definition."""
    decl_node = None
    if method_node.type == 'function_definition':
        decl_node = method_node.child_by_field_name('declarator')
    elif method_node.type == 'field_declaration':
        for child in method_node.children:
            if child.type == 'function_declarator':
                decl_node = child
                break
    elif method_node.type == 'template_declaration':
        decl = method_node.child_by_field_name('declaration')
        if decl:
            return get_method_name(decl)

    if not decl_node:
        return ""

    func_decl = find_function_declarator(decl_node)
    if not func_decl:
        return ""

    # Find name inside declarator
    name_node = func_decl.child_by_field_name('declarator')
    if name_node:
        qual_node = find_qualified_identifier(name_node)
        if qual_node:
            parts = parse_qualified_identifier(qual_node)
            if parts:
                return parts[-1]
        return name_node.text.decode('utf-8')
    return ""


def is_empty_method(body_node: Optional[Node]) -> bool:
    """Heuristic A: Check if method body is empty ({} consists of <= 2 children)."""
    if not body_node or body_node.type != 'compound_statement':
        return False
    return len(body_node.children) <= 2


def has_throw_statement(node: Optional[Node]) -> bool:
    """Heuristic B: Recursively checks if method body contains a throw statement."""
    if not node:
        return False
    if node.type == 'throw_statement':
        return True
    for child in node.children:
        if has_throw_statement(child):
            return True
    return False


def build_symbol_table(directory: Optional[str], cpp_language: Language, file_contents: Optional[Dict[str, bytes]] = None) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Phase 1: Codebase Mapping (Symbol Table building across files)"""
    parser = Parser(cpp_language)
    classes_dict: Dict[str, Any] = {}
    out_of_class_defs: List[Dict[str, Any]] = []

    if file_contents is None:
        file_contents = {}
        if directory:
            for root, _, files in os.walk(directory):
                if 'node_modules' in root or 'dist' in root:
                    continue
                for file in files:
                    if file.lower().endswith(('.h', '.hpp', '.cpp', '.cc')):
                        file_path = os.path.join(root, file)
                        try:
                            with open(file_path, 'rb') as f:
                                file_contents[file_path] = f.read()
                        except Exception as e:
                            print(f"[WARNING] Skipping file {file_path} due to read error: {e}", file=sys.stderr)

    for file_path, content in file_contents.items():
        try:
            tree = parser.parse(content)
        except Exception as e:
            print(f"[WARNING] Skipping file {file_path} due to parse error: {e}", file=sys.stderr)
            continue

        # 1. Query Classes
        try:
            class_query = Query(cpp_language, CLASS_DEFINITION_QUERY)
            cursor = QueryCursor(class_query)
            matches = cursor.matches(tree.root_node)
        except Exception as e:
            print(f"[WARNING] Failed to run class definition query on {file_path}: {e}", file=sys.stderr)
            matches = []

        for match in matches:
            match_dict = match[1]
            if 'class_node' not in match_dict or 'class_name' not in match_dict:
                continue

            class_node = match_dict['class_node'][0]
            class_name = match_dict['class_name'][0].text.decode('utf-8')
            parent_name = match_dict['base_class_name'][0].text.decode('utf-8') if 'base_class_name' in match_dict else None

            # Find body node (field_declaration_list)
            body_node = None
            for child in class_node.children:
                if child.type == 'field_declaration_list':
                    body_node = child
                    break

            if class_name not in classes_dict:
                classes_dict[class_name] = {
                    'name': class_name,
                    'parent': parent_name,
                    'file_path': file_path,
                    'class_node': class_node,
                    'methods': {}
                }
            else:
                if parent_name and not classes_dict[class_name]['parent']:
                    classes_dict[class_name]['parent'] = parent_name
                if body_node:
                    classes_dict[class_name]['file_path'] = file_path
                    classes_dict[class_name]['class_node'] = class_node

            if body_node:
                try:
                    method_query = Query(cpp_language, METHOD_QUERY)
                    m_cursor = QueryCursor(method_query)
                    m_matches = m_cursor.matches(body_node)
                except Exception as e:
                    print(f"[WARNING] Failed to run method query on class {class_name} in {file_path}: {e}", file=sys.stderr)
                    m_matches = []

                for m_match in m_matches:
                    m_dict = m_match[1]
                    if 'func_decl' not in m_dict or 'method_node' not in m_dict:
                        continue
                    method_node = m_dict['method_node'][0]
                    m_name = get_method_name(method_node)

                    if m_name:
                        is_ovr = has_override_specifier(method_node)
                        has_body = False
                        body_stmt = None
                        if method_node.type == 'function_definition':
                            body_stmt = method_node.child_by_field_name('body')
                            if body_stmt and body_stmt.type == 'compound_statement':
                                has_body = True

                        classes_dict[class_name]['methods'][m_name] = {
                            'name': m_name,
                            'is_override': is_ovr,
                            'has_body': has_body,
                            'body_node': body_stmt,
                            'file_path': file_path,
                        }

        # 2. Query out-of-class definitions
        try:
            def_query = Query(cpp_language, OUT_OF_CLASS_DEF_QUERY)
            d_cursor = QueryCursor(def_query)
            d_matches = d_cursor.matches(tree.root_node)
        except Exception as e:
            print(f"[WARNING] Failed to run function definition query on {file_path}: {e}", file=sys.stderr)
            d_matches = []

        for d_match in d_matches:
            func_def = d_match[1]['func_def'][0]
            decl_node = func_def.child_by_field_name('declarator')
            if decl_node:
                qual_node = find_qualified_identifier(decl_node)
                if qual_node:
                    parts = parse_qualified_identifier(qual_node)
                    if len(parts) >= 2:
                        c_name = parts[-2]
                        m_name = parts[-1]
                        body_stmt = func_def.child_by_field_name('body')
                        out_of_class_defs.append({
                            'class_name': c_name,
                            'method_name': m_name,
                            'body_node': body_stmt,
                            'file_path': file_path
                        })

    # Merge out-of-class definitions into classes_dict
    for ooc in out_of_class_defs:
        c_name = ooc['class_name']
        m_name = ooc['method_name']
        
        # Match class name directly or by short name
        target_class = classes_dict.get(c_name)
        if not target_class:
            c_short = get_short_name(c_name)
            for name, c_info in classes_dict.items():
                if get_short_name(name) == c_short:
                    target_class = c_info
                    break

        if target_class:
            if m_name in target_class['methods']:
                target_class['methods'][m_name]['has_body'] = True
                target_class['methods'][m_name]['body_node'] = ooc['body_node']
                target_class['methods'][m_name]['file_path'] = ooc['file_path']
            else:
                # Add to methods in case header definition was missed
                target_class['methods'][m_name] = {
                    'name': m_name,
                    'is_override': True,
                    'has_body': True,
                    'body_node': ooc['body_node'],
                    'file_path': ooc['file_path']
                }

    return classes_dict, out_of_class_defs


def run_refused_bequest_check(classes_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Phase 2 & 3: Method Analysis & Calculation of Refused Bequest"""
    issues = []

    for class_name, class_info in classes_dict.items():
        parent_name = class_info['parent']
        if not parent_name:
            continue

        # Look up parent class directly or by short name
        parent_class = classes_dict.get(parent_name)
        if not parent_class:
            parent_short = get_short_name(parent_name)
            for name, c_info in classes_dict.items():
                if get_short_name(name) == parent_short:
                    parent_class = c_info
                    break

        if not parent_class:
            # We don't have the parent class definition scanned in directory
            continue

        parent_methods = parent_class['methods']
        inherited_methods_count = len(parent_methods)

        if inherited_methods_count == 0:
            continue

        overridden_methods = []
        suspicious_methods = []

        for m_name, method in class_info['methods'].items():
            # Method overrides if marked explicitly or name matches a parent method
            is_ovr = method['is_override'] or (m_name in parent_methods)
            if is_ovr:
                overridden_methods.append(method)
                is_susp = False
                reasons = []

                if method['has_body']:
                    # Heuristic A: Empty Method
                    if is_empty_method(method['body_node']):
                        is_susp = True
                        reasons.append("Empty")
                    # Heuristic B: Throwing Method
                    elif has_throw_statement(method['body_node']):
                        is_susp = True
                        reasons.append("Throwing")

                if is_susp:
                    suspicious_methods.append((m_name, " & ".join(reasons)))

        # Calculate ratio of actively refused methods
        suspicious_overrides = len(suspicious_methods)
        ratio = suspicious_overrides / inherited_methods_count

        # A class is actively refusing a bequest if it explicitly overrides methods 
        # to throw exceptions or do nothing. We flag it if there are any such methods.
        if suspicious_overrides > 0:
            c_node = class_info.get('class_node')
            start_point = c_node.start_point if c_node else (0, 0)
            end_point = c_node.end_point if c_node else (0, 0)
            issues.append({
                'file_path': class_info['file_path'],
                'child_class': class_name,
                'parent_class': parent_class['name'],
                'ratio': ratio,
                'flagged_methods': suspicious_methods,
                'start_point': start_point,
                'end_point': end_point
            })

    return issues


