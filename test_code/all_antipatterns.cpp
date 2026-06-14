#include <iostream>

class Database {
private:
    static Database* instance;

    Database() {}

public:
    static Database* getInstance() {
        if(instance == nullptr)
            instance = new Database();

        return instance;
    }
};

Database* Database::instance = nullptr;


class Bird {
public:
    virtual void fly() {
        std::cout << "Flying";
    }
};

class Penguin : public Bird {
public:
    void fly() override {
        throw "Penguins cannot fly";
    }
};


class Payment {
public:
    virtual void pay() = 0;
};

int main() {

    Database* db = Database::getInstance();

    Penguin p;

    return 0;
}