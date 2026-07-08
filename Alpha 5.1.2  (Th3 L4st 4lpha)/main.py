from flask import Flask, render_template, request , jsonify , Response
from core.identifier import identify_hash
import os
import json
from core.cracker import crack_hash



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

@app.route("/api/crack", methods=["POST"])
def crack():
    data=request.get_json()
    hash_input= data.get("hash", "").strip()
    hash_type= data.get("type", "").strip()
    rockyou= data.get("wordlist", "default")
    if not hash_input or not hash_type :
        return jsonify({"error":"HASH MISSED"})
    def generate():
        wordlist_path=None
        base= os.path.dirname(os.path.abspath(__file__))
        wordlist_path = os.path.join(base, 'wordlist', 'rockyou.txt')
        for event in crack_hash(hash_input,hash_type,rockyou):
            yield f"data: {json.dumps(event)}\n\n"
    return Response(generate(), mimetype='text/event-stream')



if __name__ == "__main__":
    app.run(debug=True)

