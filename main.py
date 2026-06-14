import sys
import os
import tree_sitter_cpp
from tree_sitter import Language, Parser

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

def traverse_ast_for_singletons(node, singletons):
    if node.type in ('class_specifier', 'struct_specifier'):
        class_name_node = node.child_by_field_name('name')
        if class_name_node:
            class_name = class_name_node.text.decode('utf-8')
            has_static_instance = False
            has_getinstance = False

            def inspect(n):
                nonlocal has_static_instance, has_getinstance
                text = n.text.decode('utf-8')
                if "getInstance" in text:
                    has_getinstance = True
                if "static" in text and class_name in text:
                    has_static_instance = True
                for c in n.children:
                    inspect(c)

            inspect(node)
            if has_static_instance and has_getinstance:
                singletons.append({
                    'name': class_name,
                    'start_point': node.start_point,
                    'end_point': node.end_point
                })

    for child in node.children:
        traverse_ast_for_singletons(child, singletons)
    return singletons

def traverse_ast_for_refused_bequest(node, issues, current_class=None):
    if node.type == 'class_specifier':
        class_name_node = node.child_by_field_name('name')
        if class_name_node:
            current_class = class_name_node.text.decode('utf-8')
            class_text = node.text.decode('utf-8')
            if ':' in class_text:
                if "override" in class_text:
                    if "throw" in class_text or "not supported" in class_text.lower():
                        issues.append({
                            'class_name': current_class,
                            'start_point': node.start_point,
                            'end_point': node.end_point
                        })

    for child in node.children:
        traverse_ast_for_refused_bequest(child, issues, current_class)
    return issues

def traverse_ast_for_speculative_generality(node, abstract_classes, derived_classes):
    if node.type == 'class_specifier':
        name_node = node.child_by_field_name('name')
        if name_node:
            class_name = name_node.text.decode('utf-8')
            text = node.text.decode('utf-8')
            
            if "= 0" in text:
                abstract_classes.add(class_name)

            if ':' in text:
                parts = text.split(':')
                if len(parts) > 1:
                    inheritance = parts[1]
                    for abs_class in list(abstract_classes):
                        if abs_class in inheritance:
                            derived_classes.add(abs_class)

    for child in node.children:
        traverse_ast_for_speculative_generality(child, abstract_classes, derived_classes)
    return abstract_classes, derived_classes


def analyze_code(code_bytes):
    CPP_LANGUAGE = Language(tree_sitter_cpp.language())
    parser = Parser(CPP_LANGUAGE)
    tree = parser.parse(code_bytes)

    code_str = code_bytes.decode('utf-8')
    lines = code_str.splitlines()

    class_stats = traverse_ast_for_blobs(tree.root_node, {})
    mutable_globals = traverse_ast_for_globals(tree.root_node, [])
    intimacies = traverse_ast_for_intimacy(tree.root_node, [])
    singletons = traverse_ast_for_singletons(tree.root_node, [])
    refused_bequests = traverse_ast_for_refused_bequest(tree.root_node, [])
    
    abstract_classes, derived_classes = set(), set()
    traverse_ast_for_speculative_generality(tree.root_node, abstract_classes, derived_classes)


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
                "severity": "Warning",
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
            "severity": "Warning",
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
            "severity": "Warning",
            "name": s['name'],
            "line_start": line_start,
            "line_end": line_end,
            "context_start": ctx_start,
            "context_end": ctx_end,
            "description": f"Class '{s['name']}' appears to implement the Singleton pattern. Excessive use creates tight coupling.",
            "snippet": snippet
        })
            
    # 5. Refused Bequest Checker
    for r in refused_bequests:
        line_start = r['start_point'][0] + 1
        line_end = r['end_point'][0] + 1
        ctx_start = max(1, line_start - 2)
        ctx_end = min(len(lines), line_end + 2)
        snippet = '\n'.join(lines[ctx_start-1 : ctx_end])

        issues.append({
            "id": f"refused_{r['class_name']}",
            "type": "Refused Bequest",
            "severity": "Warning",
            "name": r['class_name'],
            "line_start": line_start,
            "line_end": line_end,
            "context_start": ctx_start,
            "context_end": ctx_end,
            "description": f"Class '{r['class_name']}' appears to inherit behavior it refuses (throws unsupported exceptions).",
            "snippet": snippet
        })
            
    # 6. Speculative Generality Checker 
    for cls in abstract_classes:
        if cls not in derived_classes:
            issues.append({
                "id": f"speculative_{cls}",
                "type": "Speculative Generality",
                "severity": "Warning",
                "name": cls,
                "line_start": 1,
                "line_end": 1,
                "context_start": 1,
                "context_end": min(5, len(lines)),
                "description": f"Abstract class '{cls}' has no known subclasses and may represent unused speculative design.",
                "snippet": "N/A - Global structural issue"
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
        print(f"Usage: python {sys.argv[0]} <path_to_cpp_file>")
        sys.exit(1)

    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(f"Error: File '{filepath}' not found.")
        sys.exit(1)

    analyze_file(filepath)

if __name__ == '__main__':
    main()
