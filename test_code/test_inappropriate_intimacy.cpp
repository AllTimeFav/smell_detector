class Account {
public:
    float getBalance() { return balance; }
    void deduct(float amount) { balance -= amount; }
    void add(float amount) { balance += amount; }
private:
    float balance = 100.0f;
};

// Feature Envy
class Transaction {
public:
    void process(Account& acc) {
        // Accessing methods of another class excessively
        float bal = acc.getBalance();
        acc.deduct(10.0f);
        acc.add(5.0f); 
    }
};

// Friend Declaration
class SecretData {
    friend class Hacker; // Friend declaration indicates intimacy
private:
    int secretCode;
};

class Hacker {
public:
    void steal(SecretData& data) {
        int x = data.secretCode;
    }
};

// Negative case: Normal interaction
class User {
public:
    void doSomething(Account& acc) {
        acc.getBalance(); // Only 1 call, fine
    }
};

// More intimacy edge cases
class Vault {
    friend void crack(Vault& v);
private:
    int password;
};

class Bank {
public:
    void audit(Account& acc) {
        // Direct field access feature envy (if fields were public)
        float current = acc.getBalance();
        acc.add(current * 0.05f);
        acc.deduct(current * 0.01f);
        acc.getBalance(); // 4th call
    }
};
