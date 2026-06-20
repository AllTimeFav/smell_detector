#include <iostream>
#include <unordered_map>
#include <string>

// Anti-Pattern: Global mutable configuration state
class AppConfig {
private:
    std::unordered_map<std::string, std::string> settings;
    AppConfig() {
        settings["theme"] = "dark";
        settings["api_url"] = "https://production.com";
    }

public:
    AppConfig(const AppConfig&) = delete;
    AppConfig& operator=(const AppConfig&) = delete;

    static AppConfig& getInstance() {
        static AppConfig instance;
        return instance;
    }

    std::string getSetting(const std::string& key) { return settings[key]; }
    
    // Violation: Anyone, anywhere can mutate global state at any time
    void updateSetting(const std::string& key, const std::string& value) {
        settings[key] = value; 
    }
};

class NetworkClient {
public:
    void sendData() {
        // Hidden Dependency: Deep inside the network code, it pulls from the global configuration
        std::string url = AppConfig::getInstance().getSetting("api_url");
        std::cout << "Sending data to: " << url << "\n";
    }
};

class SettingsUI {
public:
    void userClickedToggle() {
        // Side effect: A UI event completely alters the state of the network subsystem globally
        AppConfig::getInstance().updateSetting("api_url", "https://hacked-or-broken.com");
    }
};

int main() {
    NetworkClient client;
    SettingsUI ui;

    client.sendData(); // Sends to production URL
    ui.userClickedToggle();
    client.sendData(); // CRITICAL BUG: Client now unknowingly sends data to a broken URL

    return 0;
}