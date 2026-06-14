#include <iostream>

class TargetClass {
private:
    int secretData = 42;
    
    friend class IntimateClass;
};

class IntimateClass {
public:
    void printSecret(TargetClass& target) {
        std::cout << target.secretData << std::endl;
    }
};

int main() {
    TargetClass t;
    IntimateClass i;
    i.printSecret(t);
    return 0;
}
