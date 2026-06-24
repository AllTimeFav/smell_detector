#include <stdexcept>

class Bird {
public:
    virtual void fly() { /* ... */ }
    virtual void eat() { /* ... */ }
    virtual void chirp() { /* ... */ }
};

// Overriding to throw exception
class Penguin : public Bird {
public:
    void fly() override {
        throw std::runtime_error("Penguins cannot fly!");
    }
    
    // Overriding with empty method (refusing behavior)
    void chirp() override {}
};

// Negative case: Proper inheritance
class Eagle : public Bird {
public:
    void fly() override {
        int speed = 100;
        speed += 10;
    }
};

// More refused bequest edge cases
class Mammal {
public:
    virtual void walk() {}
    virtual int getLegs() { return 4; }
};

class Whale : public Mammal {
public:
    void walk() override {
        // Just comments, still empty
    }
    int getLegs() override {
        throw "Whales do not have legs"; // throwing primitive
    }
};
