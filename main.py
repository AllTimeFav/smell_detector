import sys
import os
import tree_sitter_cpp
from tree_sitter import Language, Parser, Query, QueryCursor
from refused_bequest_detector import build_symbol_table, run_refused_bequest_check
from speculative_generality_detector import analyze_speculative_generality


# Define thresholds for Blob (God Class) detection
BLOB_LOC_THRESHOLD = 300
BLOB_METHODS_THRESHOLD = 15
BLOB_ATTRIBUTES_THRESHOLD = 10

def traverse_ast_for_blobs(node, class_stats, current_class=None):
    if node.type in ('class_specifier', 'struct_specifier'):
        name_node = node.child_by_field_name('name')
        if name_node:
            current_class = name_node.text.decode('utf-8')
            if current_class not in class_stats:
                class_stats[current_class] = {
                    'name': current_class,
                    'loc': node.end_point[0] - node.start_point[0] + 1,
                    'methods': 0,
                    'attributes': 0,
                    'start_byte': node.start_byte,
                    'end_byte': node.end_byte,
                    'start_point': node.start_point,
                    'end_point': node.end_point
                }

    if current_class and node.parent and node.parent.type == 'field_declaration_list':
        is_function = False
        for child in node.children:
            if child.type == 'function_declarator':
                is_function = True
                break
                
        if node.type == 'function_definition' or is_function:
            class_stats[current_class]['methods'] += 1
        elif node.type == 'field_declaration':
            class_stats[current_class]['attributes'] += 1

    for child in node.children:
        traverse_ast_for_blobs(child, class_stats, current_class)

    return class_stats

INTIMACY_METHOD_CALL_THRESHOLD = 3

def traverse_ast_for_intimacy(node, intimacies, current_class=None, current_method=None, method_calls=None):
    if method_calls is None:
        method_calls = {}

    if node.type in ('class_specifier', 'struct_specifier'):
        name_node = node.child_by_field_name('name')
        if name_node:
            current_class = name_node.text.decode('utf-8')

    if node.type == 'function_definition':
        decl_node = node.child_by_field_name('declarator')
        def get_identifier(n):
            if not n: return None
            if n.type in ('identifier', 'field_identifier', 'destructor_name'):
                return n.text.decode('utf-8')
            for c in n.children:
                res = get_identifier(c)
                if res: return res
            return None

        method_name = get_identifier(decl_node)
        if method_name:
            current_method = method_name
            method_calls[current_method] = {
                'calls': {},
                'start_point': node.start_point,
                'end_point': node.end_point
            }

    if node.type == 'friend_declaration':
        if current_class:
            intimacies.append({
                'kind': 'friend',
                'class_name': current_class,
                'start_point': node.start_point,
                'end_point': node.end_point
            })

    if node.type == 'call_expression' and current_method:
        func_node = node.child_by_field_name('function')
        if func_node and func_node.type == 'field_expression':
            arg_node = func_node.child_by_field_name('argument')
            if arg_node and arg_node.type == 'identifier':
                obj_name = arg_node.text.decode('utf-8')
                if obj_name != 'this':
                    m_info = method_calls.get(current_method)
                    if m_info:
                        calls = m_info['calls']
                        calls[obj_name] = calls.get(obj_name, 0) + 1
                        
                        if calls[obj_name] == INTIMACY_METHOD_CALL_THRESHOLD:
                            intimacies.append({
                                'kind': 'feature_envy',
                                'method_name': current_method,
                                'class_name': current_class,
                                'object_name': obj_name,
                                'start_point': m_info['start_point'],
                                'end_point': m_info['end_point']
                            })

    for child in node.children:
        traverse_ast_for_intimacy(child, intimacies, current_class, current_method, method_calls)

    return intimacies

def traverse_ast_for_globals(node, mutable_globals):
    if node.type == 'declaration':
        parent = node.parent
        is_global_scope = False
        if parent:
            if parent.type == 'translation_unit':
                is_global_scope = True
            elif parent.type == 'declaration_list' and parent.parent and parent.parent.type == 'namespace_definition':
                is_global_scope = True

        if is_global_scope:
            is_const = False
            is_function = False
            var_name = None

            for child in node.children:
                if child.type == 'type_qualifier':
                    text = child.text.decode('utf-8')
                    if text in ('const', 'constexpr'):
                        is_const = True
                elif child.type == 'function_declarator':
                    is_function = True
                elif child.type == 'init_declarator':
                    for subchild in child.children:
                        if subchild.type == 'function_declarator':
                            is_function = True
                        elif subchild.type == 'identifier':
                            var_name = subchild.text.decode('utf-8')
                elif child.type == 'identifier' and not var_name:
                    var_name = child.text.decode('utf-8')

            if not is_const and not is_function and var_name:
                mutable_globals.append({
                    'name': var_name,
                    'start_byte': node.start_byte,
                    'end_byte': node.end_byte,
                    'start_point': node.start_point,
                    'end_point': node.end_point
                })

    for child in node.children:
        traverse_ast_for_globals(child, mutable_globals)

    return mutable_globals

def traverse_ast_for_singletons(tree, cpp_language):
    singletons = []
    query_str = """
    [
      (class_specifier
        name: (type_identifier) @class_name
        body: (field_declaration_list
          [
            (function_definition
              (storage_class_specifier) @storage
              declarator: (_) @decl
            )
            (declaration
              (storage_class_specifier) @storage
              declarator: (_) @decl
            )
          ]
        )
        (#eq? @storage "static")
        (#match? @decl "(?i)getinstance")
      ) @singleton_class
      (struct_specifier
        name: (type_identifier) @class_name
        body: (field_declaration_list
          [
            (function_definition
              (storage_class_specifier) @storage
              declarator: (_) @decl
            )
            (declaration
              (storage_class_specifier) @storage
              declarator: (_) @decl
            )
          ]
        )
        (#eq? @storage "static")
        (#match? @decl "(?i)getinstance")
      ) @singleton_class
    ]
    """
    try:
        query = Query(cpp_language, query_str)
        cursor = QueryCursor(query)
        matches = cursor.matches(tree.root_node)
        
        seen_classes = set()
        for match in matches:
            match_dict = match[1]
            if 'singleton_class' in match_dict and 'class_name' in match_dict:
                class_node = match_dict['singleton_class'][0]
                class_name = match_dict['class_name'][0].text.decode('utf-8')
                
                if class_name not in seen_classes:
                    seen_classes.add(class_name)
                    singletons.append({
                        'name': class_name,
                        'start_point': class_node.start_point,
                        'end_point': class_node.end_point
                    })
    except Exception as e:
        print(f"Singleton query error: {e}")
        
    return singletons


def analyze_code(code_bytes):
    CPP_LANGUAGE = Language(tree_sitter_cpp.language())
    parser = Parser(CPP_LANGUAGE)
    tree = parser.parse(code_bytes)

    code_str = code_bytes.decode('utf-8')
    lines = code_str.splitlines()

    class_stats = traverse_ast_for_blobs(tree.root_node, {})
    mutable_globals = traverse_ast_for_globals(tree.root_node, [])
    intimacies = traverse_ast_for_intimacy(tree.root_node, [])
    singletons = traverse_ast_for_singletons(tree, CPP_LANGUAGE)
    
    abstract_classes, derived_classes = set(), set()


    issues = []
    
    for idx, intimacy in enumerate(intimacies):
        line_start = intimacy['start_point'][0] + 1
        line_end = intimacy['end_point'][0] + 1
        ctx_start = max(1, line_start - 4)
        ctx_end = min(len(lines), line_end + 4)
        snippet = '\n'.join(lines[ctx_start-1 : ctx_end])
        
        if intimacy['kind'] == 'friend':
            desc = f"Class '{intimacy['class_name']}' uses a friend declaration. This breaks encapsulation and is a strong indicator of Inappropriate Intimacy."
            name = f"friend_in_{intimacy['class_name']}"
        else:
            desc = f"Method '{intimacy['method_name']}' in class '{intimacy['class_name']}' excessively accesses object '{intimacy['object_name']}'. This is a form of Feature Envy (Inappropriate Intimacy)."
            name = f"feature_envy_{intimacy['method_name']}"
            
        issues.append({
            "id": f"intimacy_{idx}_{name}",
            "type": "Inappropriate Intimacy",
            "severity": "Warning",
            "name": name,
            "line_start": line_start,
            "line_end": line_end,
            "context_start": ctx_start,
            "context_end": ctx_end,
            "description": desc,
            "snippet": snippet
        })
    
    for cls_name, stats in class_stats.items():
        is_blob = (
            stats['loc'] > BLOB_LOC_THRESHOLD or
            stats['methods'] > BLOB_METHODS_THRESHOLD or
            stats['attributes'] > BLOB_ATTRIBUTES_THRESHOLD
        )
        if is_blob:
            line_start = stats['start_point'][0] + 1
            line_end = stats['end_point'][0] + 1
            ctx_start = line_start
            ctx_end = line_end
            snippet = '\n'.join(lines[ctx_start-1 : ctx_end])
            desc = f"Class '{cls_name}' exceeds complexity thresholds: {stats['loc']} LOC (max {BLOB_LOC_THRESHOLD}), {stats['methods']} Methods (max {BLOB_METHODS_THRESHOLD}), {stats['attributes']} Attributes (max {BLOB_ATTRIBUTES_THRESHOLD}). This indicates a severe lack of cohesion, typical of a God Object."
            issues.append({
                "id": f"blob_{cls_name}",
                "type": "God Class",
                "severity": "Critical",
                "name": cls_name,
                "line_start": line_start,
                "line_end": line_end,
                "context_start": ctx_start,
                "context_end": ctx_end,
                "description": desc,
                "snippet": snippet
            })

    for idx, mg in enumerate(mutable_globals):
        line_start = mg['start_point'][0] + 1
        line_end = mg['end_point'][0] + 1
        
        ctx_start = max(1, line_start - 4)
        ctx_end = min(len(lines), line_end + 4)
        snippet = '\n'.join(lines[ctx_start-1 : ctx_end])

        issues.append({
            "id": f"global_{idx}_{mg['name']}",
            "type": "Mutable Global State",
            "severity": "Critical",
            "name": mg['name'],
            "line_start": line_start,
            "line_end": line_end,
            "context_start": ctx_start,
            "context_end": ctx_end,
            "description": f"Variable '{mg['name']}' is declared at the global/namespace scope without const or constexpr modifiers. Mutable global state breaks encapsulation, making code unpredictable and difficult to test.",
            "snippet": snippet
        })

    # 4. Singleton Abuse Checker
    for s in singletons:
        line_start = s['start_point'][0] + 1
        line_end = s['end_point'][0] + 1
        ctx_start = max(1, line_start - 2)
        ctx_end = min(len(lines), line_end + 2)
        snippet = '\n'.join(lines[ctx_start-1 : ctx_end])

        issues.append({
            "id": f"singleton_{s['name']}",
            "type": "Singleton Abuse",
            "severity": "High",
            "name": s['name'],
            "line_start": line_start,
            "line_end": line_end,
            "context_start": ctx_start,
            "context_end": ctx_end,
            "description": f"Class '{s['name']}' appears to implement the Singleton pattern. Excessive use creates tight coupling.",
            "snippet": snippet
        })
            

    return {"issues": issues}

def analyze_file(filepath):
    with open(filepath, 'rb') as f:
        code = f.read()

    results = analyze_code(code)

    print(f"--- Analysis for {filepath} ---")
    issues = results.get("issues", [])
    
    if not issues:
        print("No anti-patterns detected. Clean code!")
    else:
        for issue in issues:
            print(f"[{issue['severity'].upper()}] {issue['type']}: '{issue['name']}' at lines {issue['line_start']}-{issue['line_end']}")

def main():
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <path_to_cpp_file_or_directory>")
        sys.exit(1)

    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"Error: Path '{path}' not found.")
        sys.exit(1)

    if os.path.isdir(path):
        print(f"Scanning directory: {path}")
        cpp_language = Language(tree_sitter_cpp.language())
        classes_dict, _ = build_symbol_table(path, cpp_language)
        print(f"Mapped {len(classes_dict)} classes. Checking for Refused Bequest...")
        issues = run_refused_bequest_check(classes_dict)
        if not issues:
            print("\nNo Refused Bequest anti-patterns detected above the threshold.")
        else:
            print(f"\nDetected {len(issues)} Refused Bequest issue(s):\n")
            for issue in issues:
                ratio_pct = f"{issue['ratio'] * 100:.1f}%"
                print("=" * 60)
                print(f"[WARNING] Refused Bequest detected!")
                print(f"  File Path:    {issue['file_path']}")
                print(f"  Child Class:  {issue['child_class']}")
                print(f"  Parent Class: {issue['parent_class']}")
                print(f"  Ratio:        {ratio_pct} actively refused inherited methods")
                print(f"  Flagged suspicious methods:")
                for m_name, reason in issue['flagged_methods']:
                    print(f"    - {m_name} ({reason})")
            print("=" * 60)
            
        print(f"\nChecking for Speculative Generality...")
        sg_issues = analyze_speculative_generality(cpp_language, directory=path)
        if not sg_issues:
            print("No Speculative Generality anti-patterns detected.")
        else:
            print(f"\nDetected {len(sg_issues)} Speculative Generality issue(s):\n")
            for issue in sg_issues:
                print("=" * 60)
                print(f"[WARNING] Speculative Generality detected!")
                print(f"  File Path:    {issue['file_path']}")
                print(f"  Class:        {issue['class_name']}")
                print(f"  Indicators:")
                for ind in issue['indicators']:
                    print(f"    - {ind}")
            print("=" * 60)
    else:
        analyze_file(path)

if __name__ == '__main__':
    main()
