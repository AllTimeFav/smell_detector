from tree_shitter import Language, Parser
import tree_sitter_cpp as tscpp

# 1. Load the compiled C++ language grammar
CPP_LANGUAGE = Language(tscpp.language())

# 2. Initialize the parser and assign the C++ language rules
parser = Parser(CPP_LANGUAGE)

# 3. Define the C++ code snippet you want to parse
cpp_code = b"""
#include <iostream>

int main() {
    int x = 10;
    std::cout << "Value: " << x << std::endl;
    return 0;
}
"""

# 4. Parse the code string to generate the Syntax Tree
tree = parser.parse(cpp_code)

# 5. Grab the root node of the tree
root_node = tree.root_node

print(f"Root Node Type: {root_node.type}")
print(f"Total Children: {root_node.child_count}")