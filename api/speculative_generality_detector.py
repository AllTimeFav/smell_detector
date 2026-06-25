import os
import sys
import argparse
from typing import Dict, List, Any, Optional, Tuple, Set
import tree_sitter_cpp
from tree_sitter import Language, Parser, Query, QueryCursor, Node

CLASS_DEFINITION_QUERY = """
[
  (template_declaration
    (template_parameter_list) @template_params
    (class_specifier
      name: (type_identifier) @class_name
      (base_class_clause
        (type_identifier) @base_class_name
      )?
    ) @class_node
  )
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

def get_short_name(name: str) -> str:
    if not name:
        return ""
    return name.split("::")[-1]

def find_function_declarator(node: Node) -> Optional[Node]:
    if node.type == 'function_declarator':
        return node
    for child in node.children:
        res = find_function_declarator(child)
        if res: return res
    return None

def find_qualified_identifier(node: Node) -> Optional[Node]:
    if node.type == 'qualified_identifier':
        return node
    for child in node.children:
        res = find_qualified_identifier(child)
        if res: return res
    return None

def parse_qualified_identifier(node: Node) -> List[str]:
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
    decl_node = None
    if method_node.type == 'function_definition':
        decl_node = method_node.child_by_field_name('declarator')
    elif method_node.type == 'field_declaration':
        for child in method_node.children:
            if child.type == 'function_declarator':
                decl_node = child
                break
    
    if not decl_node: return ""
    func_decl = find_function_declarator(decl_node)
    if not func_decl: return ""
    
    name_node = func_decl.child_by_field_name('declarator')
    if name_node:
        qual_node = find_qualified_identifier(name_node)
        if qual_node:
            parts = parse_qualified_identifier(qual_node)
            if parts: return parts[-1]
        return name_node.text.decode('utf-8')
    return ""

def is_empty_method(body_node: Optional[Node]) -> bool:
    if not body_node or body_node.type != 'compound_statement':
        return False
    return len(body_node.children) <= 2

def has_virtual_keyword(node: Node) -> bool:
    if node.type == 'virtual':
        return True
    for child in node.children:
        if has_virtual_keyword(child):
            return True
    return False

def is_pure_virtual(method_node: Node) -> bool:
    if method_node.type == 'field_declaration':
        is_virt = False
        is_zero = False
        for child in method_node.children:
            if child.type == 'virtual':
                is_virt = True
            elif child.type == 'number_literal' and child.text.decode('utf-8') == '0':
                is_zero = True
        return is_virt and is_zero
    return False

def get_parameters(method_node: Node) -> List[str]:
    func_decl = find_function_declarator(method_node)
    if not func_decl: return []
    params = []
    for child in func_decl.children:
        if child.type == 'parameter_list':
            for p_child in child.children:
                if p_child.type == 'parameter_declaration':
                    # find identifier
                    for pp_child in p_child.children:
                        if pp_child.type == 'identifier':
                            params.append(pp_child.text.decode('utf-8'))
    return params

def is_identifier_used(node: Node, identifier: str) -> bool:
    if node.type == 'identifier' and node.text.decode('utf-8') == identifier:
        return True
    for child in node.children:
        if is_identifier_used(child, identifier):
            return True
    return False

def get_template_params(template_list_node: Node) -> List[str]:
    params = []
    for child in template_list_node.children:
        if child.type == 'type_parameter_declaration':
            for c in child.children:
                if c.type == 'type_identifier':
                    params.append(c.text.decode('utf-8'))
    return params

def is_type_identifier_used(node: Node, type_ident: str) -> bool:
    if node.type == 'type_identifier' and node.text.decode('utf-8') == type_ident:
        return True
    for child in node.children:
        if is_type_identifier_used(child, type_ident):
            return True
    return False

def build_sg_symbol_table(directory: Optional[str], cpp_language: Language, file_contents: Optional[Dict[str, bytes]] = None) -> Dict[str, Any]:
    parser = Parser(cpp_language)
    classes_dict: Dict[str, Any] = {}

    if file_contents is None:
        file_contents = {}
        if directory:
            for root, _, files in os.walk(directory):
                if 'node_modules' in root or 'dist' in root: continue
                for file in files:
                    if file.lower().endswith(('.h', '.hpp', '.cpp', '.cc')):
                        file_path = os.path.join(root, file)
                        try:
                            with open(file_path, 'rb') as f:
                                file_contents[file_path] = f.read()
                        except Exception:
                            pass

    for file_path, content in file_contents.items():
        try:
            tree = parser.parse(content)
        except Exception:
            continue

        class_query = Query(cpp_language, CLASS_DEFINITION_QUERY)
        cursor = QueryCursor(class_query)
        matches = cursor.matches(tree.root_node)

        for match in matches:
            match_dict = match[1]
            if 'class_node' not in match_dict or 'class_name' not in match_dict:
                continue

            class_node = match_dict['class_node'][0]
            class_name = match_dict['class_name'][0].text.decode('utf-8')
            parent_name = match_dict['base_class_name'][0].text.decode('utf-8') if 'base_class_name' in match_dict else None
            
            template_params = []
            if 'template_params' in match_dict:
                template_params = get_template_params(match_dict['template_params'][0])

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
                    'template_params': template_params,
                    'is_abstract': False,
                    'methods': {}
                }
            else:
                if parent_name and not classes_dict[class_name]['parent']:
                    classes_dict[class_name]['parent'] = parent_name
                if body_node:
                    classes_dict[class_name]['file_path'] = file_path
                    classes_dict[class_name]['class_node'] = class_node
                if template_params:
                    classes_dict[class_name]['template_params'] = template_params

            if body_node:
                method_query = Query(cpp_language, METHOD_QUERY)
                m_cursor = QueryCursor(method_query)
                m_matches = m_cursor.matches(body_node)
                
                for m_match in m_matches:
                    m_dict = m_match[1]
                    if 'func_decl' not in m_dict or 'method_node' not in m_dict:
                        continue
                    method_node = m_dict['method_node'][0]
                    m_name = get_method_name(method_node)

                    if m_name:
                        has_body = False
                        body_stmt = None
                        if method_node.type == 'function_definition':
                            body_stmt = method_node.child_by_field_name('body')
                            if body_stmt and body_stmt.type == 'compound_statement':
                                has_body = True
                        
                        is_pure = is_pure_virtual(method_node)
                        if is_pure:
                            classes_dict[class_name]['is_abstract'] = True

                        classes_dict[class_name]['methods'][m_name] = {
                            'name': m_name,
                            'is_pure_virtual': is_pure,
                            'is_virtual': has_virtual_keyword(method_node),
                            'has_body': has_body,
                            'body_node': body_stmt,
                            'params': get_parameters(method_node),
                            'file_path': file_path,
                        }

    return classes_dict

def analyze_speculative_generality(cpp_language: Language, file_contents: Optional[Dict[str, bytes]] = None, directory: Optional[str] = None) -> List[Dict[str, Any]]:
    classes_dict = build_sg_symbol_table(directory, cpp_language, file_contents)
    issues = []

    # Map children
    children_map = {}
    for c_name, c_info in classes_dict.items():
        p_name = c_info['parent']
        if p_name:
            p_short = get_short_name(p_name)
            if p_short not in children_map:
                children_map[p_short] = []
            children_map[p_short].append(c_name)

    for class_name, class_info in classes_dict.items():
        indicators = []
        is_core = False
        
        # 1. Abstract class with 1 child
        c_short = get_short_name(class_name)
        child_count = len(children_map.get(c_short, []))
        if class_info['is_abstract'] and child_count == 1:
            indicators.append(f"Abstract class with exactly 1 child ('{children_map[c_short][0]}')")
            is_core = True
            
        # 2. Unused Templates
        if class_info['template_params'] and class_info['class_node']:
            # Find the body node to check usage
            body_node = None
            for child in class_info['class_node'].children:
                if child.type == 'field_declaration_list':
                    body_node = child
                    break
            
            if body_node:
                for tp in class_info['template_params']:
                    if not is_type_identifier_used(body_node, tp):
                        indicators.append(f"Unused template parameter '{tp}'")
                        is_core = True

        # Secondary Indicators
        empty_methods = []
        unused_params = []
        unused_hooks = []

        for m_name, method in class_info['methods'].items():
            if method['has_body']:
                if is_empty_method(method['body_node']):
                    empty_methods.append(m_name)
                    
                    # Check if it's an unused virtual hook
                    if method['is_virtual']:
                        # Are there any subclasses overriding this?
                        overridden = False
                        for child_name in children_map.get(c_short, []):
                            child_info = classes_dict.get(child_name)
                            if child_info and m_name in child_info['methods']:
                                overridden = True
                                break
                        if not overridden:
                            unused_hooks.append(m_name)

                # Check unused parameters
                for p in method['params']:
                    if not is_identifier_used(method['body_node'], p):
                        unused_params.append(f"{m_name}({p})")

        if empty_methods:
            indicators.append(f"Empty methods ({', '.join(empty_methods)})")
        if unused_params:
            indicators.append(f"Unused parameters ({', '.join(unused_params)})")
        if unused_hooks:
            indicators.append(f"Unused virtual hooks ({', '.join(unused_hooks)})")

        secondary_count = (1 if empty_methods else 0) + (1 if unused_params else 0) + (1 if unused_hooks else 0)

        # Flag if core indicator is present OR >= 2 secondary indicators
        if is_core or secondary_count >= 2:
            c_node = class_info['class_node']
            issues.append({
                'file_path': class_info['file_path'],
                'class_name': class_name,
                'indicators': indicators,
                'start_point': c_node.start_point if c_node else (0, 0),
                'end_point': c_node.end_point if c_node else (0, 0)
            })

    return issues
