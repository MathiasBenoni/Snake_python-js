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
snake_body = []
fruits = []
bulge_index = None  # Track which segment has the bulge
last_direction = "right"  # Track last direction to prevent reversing

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

@app.route("/spawn_fruit", methods=["POST"])
def spawn_one():
    fruit = spawn_fruit()
    return jsonify(fruit)

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

@app.route("/move", methods=["POST"])
def move():
    global position, snake_body, fruits, bulge_index, last_direction
    data = request.json
    x, y = position["x"], position["y"]
    direction = data.get("direction")
    
    # Prevent reversing direction
    opposites = {"up": "down", "down": "up", "left": "right", "right": "left"}
    if opposites.get(last_direction) == direction:
        direction = last_direction
    
    if direction == "up" and y >= tile_size:
        y -= tile_size
    elif direction == "down" and y <= board_height - tile_size * 2:
        y += tile_size
    elif direction == "left" and x >= tile_size:
        x -= tile_size
    elif direction == "right" and x <= board_width - tile_size * 2:
        x += tile_size
    
    last_direction = direction

    old_head_tile = {"x": int(position["x"]/tile_size), "y": int(position["y"]/tile_size)}
    position["x"], position["y"] = x, y

    # Move body: add old head position to front
    snake_body.insert(0, old_head_tile)
    
    # Move bulge down the body (move 2 segments per step for faster travel)
    if bulge_index is not None:
        bulge_index += 2  # Move faster: 2 segments per move
    
    # Check if we should grow
    px, py = int(x / tile_size), int(y / tile_size)
    ate_fruit = False
    
    for fruit in fruits[:]:
        if fruit["x"] == px and fruit["y"] == py:
            fruits.remove(fruit)
            ate_fruit = True
            bulge_index = 0  # Start bulge at front of body
            spawn_fruit()
            break
    
    # Remove tail only if we didn't eat
    if not ate_fruit:
        # Check if bulge is at the end
        if bulge_index is not None and bulge_index >= len(snake_body):
            bulge_index = None  # Remove bulge when it reaches the end
        snake_body.pop()

    return jsonify(position)

if __name__ == "__main__":
    spawn_fruit()
    app.run(debug=True)