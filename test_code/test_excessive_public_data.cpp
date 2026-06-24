// Struct defaults to public
struct DataBlob {
    int a, b, c;
    double x, y, z;
};

class Configuration {
public:
    int retries;
    int timeout;
    bool verbose;
    bool debug;
    char mode;
    float threshold;
    char mode;
private:
    int internal_state;
};

// Negative case
class SmallConfig {
public:
    int retries;
    int timeout; 
private:
    int x, y, z, w, v, u;
};

// Negative case
class ManyMethods {
public:
    void m1(); void m2(); void m3();
    void m4(); void m5(); void m6();
    int data1;
};
