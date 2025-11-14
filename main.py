from flask import Flask, jsonify, request, send_from_directory
import random

app = Flask(__name__, static_folder="build")

# --- Game constants ---
tile_size = 40
board_width = 400
board_height = 400

cols = board_width // tile_size
rows = board_height // tile_size
speed = tile_size

# --- Game state ---
position = {"x": 200, "y": 200}
snake_body = [{"x": 4, "y": 5}]
fruits = []
bulge_index = None
last_direction = "right"
game_over = False
max_fruits = 1  # Default number of fruits

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/script.js")
def script():
    return send_from_directory(app.static_folder, "script.js")

@app.route("/position")
def get_position():
    return jsonify(position)

@app.route("/snake_body")
def get_snake_body():
    return jsonify({
        "segments": snake_body,
        "bulge_index": bulge_index
    })

@app.route("/fruits")
def get_fruits():
    return jsonify(fruits)

@app.route("/game_over")
def get_game_over():
    return jsonify({"game_over": game_over})

@app.route("/set_fruit_count", methods=["POST"])
def set_fruit_count():
    global max_fruits
    data = request.json
    count = data.get("count", 1)
    max_fruits = max(1, min(count, 20))  # Between 1 and 20
    return jsonify({"max_fruits": max_fruits})

@app.route("/spawn_fruit", methods=["POST"])
def spawn_one():
    fruit = spawn_fruit()
    return jsonify(fruit)

@app.route("/reset", methods=["POST"])
def reset():
    global position, snake_body, fruits, bulge_index, last_direction, game_over
    position = {"x": 200, "y": 200}
    snake_body = [{"x": 4, "y": 5}]
    fruits = []
    bulge_index = None
    last_direction = "right"
    game_over = False
    
    # Spawn initial fruits based on max_fruits
    for _ in range(max_fruits):
        spawn_fruit()
    
    return jsonify({"success": True})

def player_tile():
    return int(position["x"] / tile_size), int(position["y"] / tile_size)

def spawn_fruit():
    player_x, player_y = player_tile()
    valid_tiles = [
        (x, y)
        for x in range(cols)
        for y in range(rows)
        if not (x == player_x and y == player_y)
        and (x, y) not in [(s["x"], s["y"]) for s in snake_body]
        and (x, y) not in [(f["x"], f["y"]) for f in fruits]
    ]

    if not valid_tiles:
        return None

    tile = random.choice(valid_tiles)
    fruits.append({"x": tile[0], "y": tile[1]})
    return tile

def check_win_condition():
    """Check if the board is completely filled with snake"""
    total_tiles = cols * rows
    # Head + body segments
    snake_length = 1 + len(snake_body)
    return snake_length >= total_tiles

@app.route("/move", methods=["POST"])
def move():
    global position, snake_body, fruits, bulge_index, last_direction, game_over
    
    if game_over:
        return jsonify({"game_over": True, "won": False})
    
    data = request.json
    x, y = position["x"], position["y"]
    direction = data.get("direction")
    
    # Prevent reversing direction
    opposites = {"up": "down", "down": "up", "left": "right", "right": "left"}
    if opposites.get(last_direction) == direction:
        direction = last_direction
    
    # Calculate new position
    if direction == "up":
        y -= tile_size
    elif direction == "down":
        y += tile_size
    elif direction == "left":
        x -= tile_size
    elif direction == "right":
        x += tile_size
    
    # Check wall collision BEFORE updating position
    if x < 0 or x >= board_width or y < 0 or y >= board_height:
        game_over = True
        won = check_win_condition()
        return jsonify({"game_over": True, "won": won})
    
    # Check self collision
    new_tile_x = int(x / tile_size)
    new_tile_y = int(y / tile_size)
    for seg in snake_body:
        if seg["x"] == new_tile_x and seg["y"] == new_tile_y:
            game_over = True
            won = check_win_condition()
            return jsonify({"game_over": True, "won": won})
    
    last_direction = direction

    old_head_tile = {"x": int(position["x"]/tile_size), "y": int(position["y"]/tile_size)}
    position["x"], position["y"] = x, y

    # Move body: add old head position to front
    snake_body.insert(0, old_head_tile)
    
    # Move bulge down the body (move 2 segments per step for faster travel)
    if bulge_index is not None:
        bulge_index += 2
    
    # Check if we should grow
    px, py = int(x / tile_size), int(y / tile_size)
    ate_fruit = False
    
    for fruit in fruits[:]:
        if fruit["x"] == px and fruit["y"] == py:
            fruits.remove(fruit)
            ate_fruit = True
            bulge_index = 0
            # Maintain fruit count
            spawn_fruit()
            break
    
    # Remove tail only if we didn't eat
    if not ate_fruit:
        # Check if bulge is at the end
        if bulge_index is not None and bulge_index >= len(snake_body):
            bulge_index = None
        snake_body.pop()

    return jsonify({"game_over": False, "won": False, "position": position})

if __name__ == "__main__":
    for _ in range(max_fruits):
        spawn_fruit()
    app.run(debug=True)