from tree_sitter import Node

PUBLIC_DATA_THRESHOLD = 5

def traverse_ast_for_public_data_members(node: Node, classes: list):
    """
    Recursively traverses the AST to find classes or structs with an excessive number
    of public data members (fields).
    """
    if node.type in ('class_specifier', 'struct_specifier'):
        name_node = node.child_by_field_name('name')
        if name_node:
            class_name = name_node.text.decode('utf-8')
            body_node = node.child_by_field_name('body')
            if body_node and body_node.type == 'field_declaration_list':
                public_fields = 0
                is_struct = (node.type == 'struct_specifier')
                current_access = 'public' if is_struct else 'private'
                
                for child in body_node.children:
                    if child.type == 'access_specifier':
                        text = child.text.decode('utf-8').strip()
                        if text.startswith('public'):
                            current_access = 'public'
                        elif text.startswith('private'):
                            current_access = 'private'
                        elif text.startswith('protected'):
                            current_access = 'protected'
                    elif child.type == 'field_declaration' and current_access == 'public':
                        is_method = False
                        for sub in child.children:
                            if sub.type == 'function_declarator':
                                is_method = True
                                break
                        if not is_method:
                            comma_count = sum(1 for sub in child.children if sub.type == ',')
                            public_fields += (comma_count + 1)

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
