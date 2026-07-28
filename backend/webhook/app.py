"""
webhook/app.py

TEAMMATE: this is your file. See docs/02_guidebook_whatsapp_ui.md for the
full walkthrough (Twilio sandbox setup, ngrok, testing).

This is the "UI" in this architecture — the whole interface is a WhatsApp
chat, and this Flask app is what Twilio calls every time the user sends a
message. It's already wired to Agent 1 below; you shouldn't need to touch
agents/ or tools/ at all.
"""

from flask import Flask, request, jsonify
from twilio.twiml.messaging_response import MessagingResponse

from backend.agents.geographic_agent import run_geographic_agent
from backend.agents.route_options_agent import generate_route_options
from backend.webhook.formatter import format_whatsapp_reply
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route("/whatsapp", methods=["POST"])
def whatsapp_webhook():
    incoming_msg = request.values.get("Body", "").strip()

    result = run_geographic_agent(incoming_msg)
    reply_text = format_whatsapp_reply(result)

    twiml = MessagingResponse()
    twiml.message(reply_text)
    return str(twiml)


@app.route("/api/geographic", methods=["POST"])
def geographic_api():

    data = request.get_json()

    message = data.get("message", "").strip()

    if not message:
        return jsonify({"success": False, "error": "Message is required"}), 400

    try:
        result = run_geographic_agent(message)

        return jsonify({"success": True, "result": result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/route-options", methods=["POST"])
def route_options_api():

    data = request.get_json()

    geo_result = data.get("geo")

    if not geo_result:
        return jsonify({"success": False, "error": "GeoAgentState is required"}), 400

    try:
        result = generate_route_options(geo_result)

        return jsonify({"success": True, "result": result})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Quick sanity check while setting up ngrok/Twilio — hit this in a browser."""
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
