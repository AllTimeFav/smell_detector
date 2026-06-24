// Singleton Abuse
class DatabaseConnection {
private:
    static DatabaseConnection* instance;
    DatabaseConnection() {}

public:
    static DatabaseConnection* getInstance() {
        if (!instance) {
            instance = new DatabaseConnection();
        }
        return instance;
    }
};

// Normal class
class NormalClass {
public:
    void doSomething() {}
};

// More singleton edge cases
class ReferenceSingleton {
private:
    ReferenceSingleton() {}
public:
    static ReferenceSingleton& GetInstance() { // case-insensitive match
        static ReferenceSingleton instance;
        return instance;
    }
};

struct StructSingleton {
    static StructSingleton* instance;
    static StructSingleton* getInstance() { return nullptr; }
};
