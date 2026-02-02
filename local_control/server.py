import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import pyautogui
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Map actions to media keys
KEY_MAPPING = {
    'play': 'playpause',
    'pause': 'playpause',
    'next': 'nexttrack',
    'previous': 'prevtrack',
    'vol_up': 'volumeup',
    'vol_down': 'volumedown'
}

@app.route('/control', methods=['POST'])
def control_playback():
    data = request.json
    action = data.get('action')

    if action not in KEY_MAPPING:
        return jsonify({"status": "error", "message": "Invalid action"}), 400

    key = KEY_MAPPING[action]
    
    try:
        logging.info(f"Executing Action: {action} -> Key: {key}")
        pyautogui.press(key)
        return jsonify({"status": "success", "action": action, "key": key})
    except Exception as e:
        logging.error(f"Failed to press key: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online", "message": "Gesture Controller Backend is Running"})

if __name__ == '__main__':
    print("-------------------------------------------------------")
    print("   SPOTIFY GESTURE CONTROLLER - LOCAL BACKEND")
    print("   Running on http://localhost:5000")
    print("-------------------------------------------------------")
    app.run(host='0.0.0.0', port=5000)
