#include <iostream>

// 1. Abstract class with only one child (Core Indicator)
class AbstractBase {
public:
    virtual void doSomething() = 0;
};

class OnlyChild : public AbstractBase {
public:
    void doSomething() override {
        std::cout << "Doing something\n";
    }
};

// 2. Unused Templates/Generics (Core Indicator)
template <typename T, typename U>
class GenericClass {
public:
    void print() {
        std::cout << "Not using T or U at all\n";
    }
};

// 3. Secondary Indicators (Empty methods, Unused parameters, Unused virtual hooks)
class SecondaryIndicatorsClass {
public:
    // Empty method
    void emptyMethod() {}
    
    // Unused parameter
    void methodWithUnusedParam(int x, int y) {
        std::cout << "Only using x: " << x << "\n";
        // y is unused
    }
    
    // Unused virtual hook (never overridden since this class has no children)
    virtual void unusedHook() {}
};
