#include <iostream>
#include <string>
#include <vector>
#include <stdexcept>

// =====================================================================
// 1. MUTABLE GLOBAL STATE
// Anti-Pattern: Using global variables that can be modified by any 
// function at any time, leading to unpredictable side effects.
// =====================================================================
int globalPlayerScore = 0;
int globalEnemyCount = 10;
bool globalIsRunning = true;


// =====================================================================
// 2. REFUSED BEQUEST (Inappropriate Inheritance)
// Anti-Pattern: A child class inherits from a parent but explicitly 
// rejects or throws exceptions for the methods it was forced to inherit.
// =====================================================================
class GameObject {
public:
    virtual void walk() = 0;
    virtual void attack() = 0;
    virtual void render() = 0;
};

class StaticRock : public GameObject {
public:
    void walk() override {
        // Refused Bequest: Rocks cannot walk! 
        throw std::logic_error("Rocks cannot walk, method not supported!");
    }
    
    void attack() override {
        // Refused Bequest: Rocks cannot attack!
        throw std::logic_error("Rocks cannot attack, method not supported!");
    }
    
    void render() override {
        std::cout << "Rendering a static rock." << std::endl;
    }
};


// Simple data class used to demonstrate Feature Envy
class Player {
private:
    int health = 100;
    int armor = 50;
public:
    int getHealth() const { return health; }
    void setHealth(int h) { health = h; }
    int getArmor() const { return armor; }
};


// =====================================================================
// 3. GOD CLASS (The Blob)
// Anti-Pattern: A single massive class that centralizes the intelligence 
// of the system. It handles networking, audio, UI, and game logic all at once.
// =====================================================================
class GameManager {
private:
    Player player;
    std::vector<StaticRock> rocks;
    int networkLatency = 40;
    int audioVolume = 80;

public:
    // =====================================================================
    // 4. FEATURE ENVY
    // Anti-Pattern: This method is more interested in the data of the `Player` 
    // class than its own class. It extracts data, computes it, and pushes it back.
    // Fix: This logic belongs inside the Player class itself (e.g., player.takeDamage()).
    // =====================================================================
    void calculateDamageTaken(int incomingDamage) {
        int effectiveArmor = player.getArmor() / 2;
        int damage = incomingDamage - effectiveArmor;
        if (damage < 0) damage = 0;
        
        player.setHealth(player.getHealth() - damage); 
    }

    // =====================================================================
    // 5. LONG METHOD & 6. SPAGHETTI CODE
    // Anti-Pattern (Long Method): This single function tries to handle UI, audio, 
    // physics, and networking synchronously in one giant block.
    // Anti-Pattern (Spaghetti): Complex nested if-statements and the use of 'goto' 
    // to jump around execution blocks chaotically without passing parameters.
    // =====================================================================
    void runGameLoop() {
        int connectionRetries = 0;
        
    retryConnection: // SPAGHETTI: Jump label
        if (connectionRetries < 3) {
            std::cout << "Attempting to connect to server..." << std::endl;
            if (networkLatency > 100) {
                connectionRetries++;
                goto retryConnection; // SPAGHETTI: Control flow jumps backwards
            }
        }

        while (globalIsRunning) {
            // --- UI UPDATE BLOCK ---
            std::cout << "Score: " << globalPlayerScore << std::endl; // Mutates/reads global state
            
            // --- AUDIO PROCESSING BLOCK ---
            if (audioVolume > 0) {
                std::cout << "Playing background music..." << std::endl;
            }

            // --- PHYSICS & LOGIC BLOCK ---
            for(int i = 0; i < globalEnemyCount; i++) {
                // Spaghetti: deeply nested, confusing control flow
                if (i % 2 == 0) {
                    if (globalPlayerScore < 50) {
                        calculateDamageTaken(20);
                    }
                } else {
                    globalPlayerScore += 5; // Modifying global state secretly inside a loop
                }
            }

            // --- NETWORK SYNC BLOCK ---
            if (networkLatency < 50) {
                std::cout << "Syncing state with server..." << std::endl;
            } else {
                goto networkFailure; // SPAGHETTI: Jumping forward to an error state
            }

            // End game after one loop for demonstration
            globalIsRunning = false; 
            continue; 
            
        networkFailure: // SPAGHETTI: Jump label execution
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