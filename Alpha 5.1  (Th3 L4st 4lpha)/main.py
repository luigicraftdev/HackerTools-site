from flask import Flask, render_template, request , jsonify
from core.identifier import identify_hash

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/HDIW")
def hdiw():
    return render_template("HDIW.html")

@app.route("/api/identify", methods=["POST"])
def identify():
    data=request.get_json()
    hash_input = data.get("hash" , "").strip()
    if  not hash_input :
        return jsonify({"error":"HASH MISSED"})
    result=identify_hash(hash_input)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)

