// Mutable global variables (No const/constexpr)
int global_counter = 0;
float global_speed;

namespace GameState {
    int current_level = 1;
    bool is_playing = false;
}

//Immutable globals or functions
const int MAX_PLAYERS = 4;
constexpr double PI = 3.14159;

void updateGame() {
    
    int local_var = 10; 
}

// Function pointer
void (*global_func_ptr)() = nullptr;
