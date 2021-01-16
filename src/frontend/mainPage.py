from flask import Flask, render_template, request
from courseInterface import getCourses

app = Flask(__name__)


email = ""

@app.route("/", methods=['GET'])
def index():
    if(request.method == "GET"):
        return render_template("index.html", courses=getCourses())


if __name__ == "__main__":
    app.run(debug=True, port=5051)