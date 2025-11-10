from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder="build")

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

@app.route("/move", methods=["POST"])
def move():
    global position
    data = request.json
    x, y = position["x"], position["y"]
    direction = data.get("direction")
    if direction == "up":
        y -= speed
    elif direction == "down":
        y += speed
    elif direction == "left":
        x -= speed
    elif direction == "right":
        x += speed
    position["x"], position["y"] = x, y
    return jsonify(position)

@app.route("/position")
def get_position():
    return jsonify(position)

if __name__ == "__main__":
    app.run(debug=True)