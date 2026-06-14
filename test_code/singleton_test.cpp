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

int main() {
    Database* db = Database::getInstance();
}