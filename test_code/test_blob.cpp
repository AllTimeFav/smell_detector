

int bad_global = 10;
static float another_bad_global;
const int good_global = 20;
constexpr float another_good_global = 3.14;

// 1. A healthy class
class OkayClass {
private:
    int id;
    float value;

public:
    OkayClass();
    void doSomething();
    float getValue() const;
};

// 2. A Blob Class
class TestClass {
private:
    int attr1;
    int attr2;
    int attr3;
    int attr4;
    int attr5;
    int attr6;
    int attr7;
    int attr8;
    int attr9;
    int attr10;
    int attr11;
    int attr12;

public:
    TestClass();
    ~TestClass();

    void method1();
    void method2();
    void method3();
    void method4();
    void method5();
    void method6();
    void method7();
    void method8();
    void method9();
    void method10();
    void method11();
    void method12();
    void method13();
    void method14();
    void method15();
    void method16();
    
    // Inline heavy method
    void largeMethod() {
        attr1 = 1;
        attr2 = 2;
        // ... imagine lots of logic here
    }
};
