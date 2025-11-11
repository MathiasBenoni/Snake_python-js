from flask import Flask, jsonify, request, send_from_directory
import random 


app = Flask(__name__, static_folder="build")

rutestorrelse = 40

brett_y = 400
brett_x = 400

brett_x_ruter = int(brett_x / rutestorrelse)
brett_y_ruter = int(brett_y / rutestorrelse)

position = {"x": 200, "y": 200}
speed = 40

@app.route("/")
def index():
    # sender index.html fra build-mappen
    return send_from_directory(app.static_folder, "index.html")

@app.route("/script.js")
def script():
    # sender JS fra build-mappen
    return send_from_directory(app.static_folder, "script.js")


def eat_fruit():
    pass

fruits = []

def spawn_fruit():
    valid_tiles = []

    player_tile_x = int(position["x"] / rutestorrelse)
    player_tile_y = int(position["y"] / rutestorrelse)
    
    for x in range(brett_x_ruter):
        for y in range(brett_y_ruter):
            if not (x == player_tile_x and y == player_tile_y):
                valid_tiles.append((x, y))

    if not valid_tiles:
        return None

    tile = random.choice(valid_tiles)
    fruits.append({"x": tile[0], "y": tile[1]})
    return tile

@app.route("/fruits", methods=["GET"])
def get_fruits():
    return jsonify(fruits)

@app.route("/spawn_fruit", methods=["POST"])
def spawn_one():
    fruit = spawn_fruit()
    return jsonify(fruit)


@app.route("/move", methods=["POST"])
def move():
    
    global position
    data = request.json
    x, y = position["x"], position["y"]
    direction = data.get("direction")
    if direction == "up" and position["y"] >= 40:
        y -= speed
    elif direction == "down" and position["y"] <= 320:
        y += speed
    elif direction == "left" and position["x"] >= 40:
        x -= speed
    elif direction == "right" and position["x"] <= 320:
        x += speed
    position["x"], position["y"] = x, y


    return jsonify(position)

@app.route("/position")
def get_position():
    return jsonify(position)
if __name__ == "__main__":
    app.run(debug=True)