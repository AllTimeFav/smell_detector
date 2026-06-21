import sys
import os
import tree_sitter_cpp
from tree_sitter import Language, Parser, Query, QueryCursor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Safely import custom detectors
try:
    from refused_bequest_detector import build_symbol_table, run_refused_bequest_check
    from speculative_generality_detector import analyze_speculative_generality
except ImportError:
    # Fallback mock implementations if modules aren't in the same directory
    def build_symbol_table(path, lang): return {}, None
    def run_refused_bequest_check(classes): return []
    def analyze_speculative_generality(lang, directory): return []

# Create the FastAPI instance
app = FastAPI(
    title="C++ Code Smell Detector API", 
    description="Scan your C++ files for anti-patterns dynamically.",
    version="1.0.0"
)

PUBLIC_DATA_THRESHOLD = 5
INTIMACY_METHOD_CALL_THRESHOLD = 3

class ScanRequest(BaseModel):
    path: str

def traverse_ast_for_public_data_members(node, classes):
    if node.type in ('class_specifier', 'struct_specifier'):
        name_node = node.child_by_field_name('name')
        if name_node:
            class_name = name_node.text.decode('utf-8')
            public_fields = 0
            text = node.text.decode('utf-8')
            lines = text.split('\n')
            inside_public = False
            for line in lines:
                line = line.strip()
                if line.startswith("public:"):
                    inside_public = True
                    continue
                if line.startswith("private:") or line.startswith("protected:"):
                    inside_public = False
                    continue
                if inside_public:
                    if ";" in line and "(" not in line:
                        public_fields += 1

            if public_fields > PUBLIC_DATA_THRESHOLD:
                classes.append({
                    "name": class_name,
                    "count": public_fields,
                    "start_point": node.start_point,
                    "end_point": node.end_point
                })

    for child in node.children:
        traverse_ast_for_public_data_members(child, classes)
    return classes

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

    code_str = code_bytes.decode('utf-8', errors='ignore')
    lines = code_str.splitlines()

    public_data_classes = traverse_ast_for_public_data_members(tree.root_node, [])
    mutable_globals = traverse_ast_for_globals(tree.root_node, [])
    intimacies = traverse_ast_for_intimacy(tree.root_node, [])
    singletons = traverse_ast_for_singletons(tree, CPP_LANGUAGE)
    
    issues = []
    
    for idx, intimacy in enumerate(intimacies):
        line_start = intimacy['start_point'][0] + 1
        line_end = intimacy['end_point'][0] + 1
        ctx_start = max(1, line_start - 4)
        ctx_end = min(len(lines), line_end + 4)
        snippet = '\n'.join(lines[ctx_start-1 : ctx_end])
        
        if intimacy['kind'] == 'friend':
            desc = f"Class '{intimacy['class_name']}' uses a friend declaration. This breaks encapsulation."
            name = f"friend_in_{intimacy['class_name']}"
        else:
            desc = f"Method '{intimacy['method_name']}' excessively accesses object '{intimacy['object_name']}'."
            name = f"feature_envy_{intimacy['method_name']}"
            
        issues.append({
            "id": f"intimacy_{idx}_{name}",
            "type": "Inappropriate Intimacy",
            "severity": "Warning",
            "name": name,
            "line_start": line_start,
            "line_end": line_end,
            "description": desc,
            "snippet": snippet
        })
    
    for cls in public_data_classes:
        line_start = cls['start_point'][0] + 1
        line_end = cls['end_point'][0] + 1
        ctx_start = max(1, line_start - 2)
        ctx_end = min(len(lines), line_end + 2)
        snippet = '\n'.join(lines[ctx_start-1:ctx_end])

        issues.append({
            "id": f"public_data_{cls['name']}",
            "type": "Excessive Public Data Members",
            "severity": "High",
            "name": cls['name'],
            "line_start": line_start,
            "line_end": line_end,
            "description": f"Class '{cls['name']}' contains {cls['count']} public data members.",
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
            "description": f"Variable '{mg['name']}' is declared at global/namespace scope without const.",
            "snippet": snippet
        })

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
            "description": f"Class '{s['name']}' appears to implement the Singleton pattern.",
            "snippet": snippet
        })
            
    return {"issues": issues}

# --- ENDPOINTS ---

@app.get("/")
def home():
    return {
        "status": "Success",
        "message": "Welcome to the Code Smell Detector! Use /docs to visually test endpoints.",
        "test_scanner_url": "http://127.0.0.1:5000/docs"
    }

@app.post("/api/scan")
def scan_directory_or_file(request: ScanRequest):
    path = request.path
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Target path '{path}' does not exist.")

    results = {"file_issues": [], "structural_issues": {}}

    if os.path.isfile(path):
        with open(path, 'rb') as f:
            code = f.read()
        file_results = analyze_code(code)
        results["file_issues"] = file_results.get("issues", [])
    
    elif os.path.isdir(path):
        cpp_language = Language(tree_sitter_cpp.language())
        classes_dict, _ = build_symbol_table(path, cpp_language)
        
        rb_issues = run_refused_bequest_check(classes_dict)
        sg_issues = analyze_speculative_generality(cpp_language, directory=path)
        
        results["structural_issues"] = {
            "refused_bequest": rb_issues,
            "speculative_generality": sg_issues
        }

    return results

if __name__ == '__main__':
    # Using the 'app' instance explicitly eliminates naming mismatches
    uvicorn.run(app, host="127.0.0.1", port=5000)