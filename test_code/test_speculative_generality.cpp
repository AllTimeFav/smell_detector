// Abstract class with exactly 1 child
class AbstractProcessor {
public:
    virtual void process() = 0; // Pure virtual
};

class OnlyChildProcessor : public AbstractProcessor {
public:
    void process() override {
        int x = 1;
    }
};

// Unused template parameter
template <typename T, typename U>
class GenericContainer {
    T data; // T is used
    // U is not used!
};

// Unused parameter & Empty hook
class BaseHandler {
public:
    // Empty virtual hook not overridden by anyone
    virtual void onEvent() {} 
    
    // Unused parameter 'flags'
    void handle(int data, int flags) {
        int y = data + 1;
    }
};

// Interface with 2+ children
class IRenderer {
public:
    virtual void render() = 0;
};

class OpenGLRenderer : public IRenderer {
public:
    void render() override {}
};

class DirectXRenderer : public IRenderer {
public:
    void render() override {}
};

//  Used template
template <typename K, typename V>
class Dictionary {
    K key;
    V value;
};

// More speculative generality edge cases
class IOrphanedInterface {
public:
    virtual void doWork() = 0; // 0 children
};

template <class X, class Y, class Z>
struct TripleTrouble {
    X x; 
    Y y;
    // Z is unused
};

class EventListener {
public:
    virtual void onMouseClick(int x, int y) {} // unused parameters and empty body
};
