class BaseClass {
public:
    virtual void doA();
    virtual void doB();
    virtual void doC();
    virtual void doD();
    virtual void doE();
};

class RefusedBequestChild : public BaseClass {
public:
    void doA() override {} 
    
    void doB() override {  
        throw "not supported";
    }
    
    void doC() override {
        int x = 1;
    }
};
