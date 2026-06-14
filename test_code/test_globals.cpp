#include <iostream>
#include <string>
#include <vector>
#include <stdexcept>

int globalPlayerScore = 0;
int globalEnemyCount = 10;
bool globalIsRunning = true;


class GameObject {
public:
    virtual void walk() = 0;
    virtual void attack() = 0;
    virtual void render() = 0;
};

class StaticRock : public GameObject {
public:
    void walk() override {
        throw std::logic_error("Rocks cannot walk, method not supported!");
    }
    
    void attack() override {
        throw std::logic_error("Rocks cannot attack, method not supported!");
    }
    
    void render() override {
        std::cout << "Rendering a static rock." << std::endl;
    }
};

class Player {
private:
    int health = 100;
    int armor = 50;
public:
    int getHealth() const { return health; }
    void setHealth(int h) { health = h; }
    int getArmor() const { return armor; }
};


class GameManager {
private:
    Player player;
    std::vector<StaticRock> rocks;
    int networkLatency = 40;
    int audioVolume = 80;

public:

    void calculateDamageTaken(int incomingDamage) {
        int effectiveArmor = player.getArmor() / 2;
        int damage = incomingDamage - effectiveArmor;
        if (damage < 0) damage = 0;
        
        player.setHealth(player.getHealth() - damage); 
    }

    void runGameLoop() {
        int connectionRetries = 0;
        
    retryConnection:
        if (connectionRetries < 3) {
            std::cout << "Attempting to connect to server..." << std::endl;
            if (networkLatency > 100) {
                connectionRetries++;
                goto retryConnection;
            }
        }

        while (globalIsRunning) {
            std::cout << "Score: " << globalPlayerScore << std::endl;
            
            if (audioVolume > 0) {
                std::cout << "Playing background music..." << std::endl;
            }

            for(int i = 0; i < globalEnemyCount; i++) {
                if (i % 2 == 0) {
                    if (globalPlayerScore < 50) {
                        calculateDamageTaken(20);
                    }
                } else {
                    globalPlayerScore += 5;
                }
            }

            if (networkLatency < 50) {
                std::cout << "Syncing state with server..." << std::endl;
            } else {
                goto networkFailure;
            }

            globalIsRunning = false; 
            continue; 
            
        networkFailure:
            std::cout << "Fatal Network Error! Dropping game state." << std::endl;
            globalIsRunning = false;
        }
    }
};

int main() {
    GameManager godObject;
    
    std::cout << "Starting anti-pattern simulation...\n";
    godObject.runGameLoop();
    
    return 0;
}