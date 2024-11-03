from collections import Counter
import re
from flask import Flask, jsonify
import requests
import json
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MTA_ALERTS_JSON_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json"

# Load the subway stations from stations.json and create a set of valid station names
with open('stations.json', 'r') as f:
    stations_data = json.load(f)
STATION_NAMES = {station["name"]: station["short"] for station in stations_data}  # Map names to stop_ids

def extract_lines_from_text(alert_text):
    """Extract subway lines from the alert text using regex to find patterns in brackets [ ]."""
    return re.findall(r"\[([A-Za-z0-9]+)\]", alert_text)

def fetch_subway_alerts():
    """Fetch subway alerts from the MTA JSON feed and separate immediate and ongoing alerts."""
    try:
        response = requests.get(MTA_ALERTS_JSON_URL)
        
        if response.status_code != 200:
            print(f"Error: Received status code {response.status_code}")
            return []
        
        data = response.json()
        alerts = []
        line_counter = Counter()  # Counter to track alerts per line

        current_date = datetime.now().date()  # Today's date
        for entity in data.get("entity", []):
            alert = entity.get("alert")
            if alert:
                alert_text = alert.get("header_text", {}).get("translation", [{}])[0].get("text", "No details available")
                
                # Parse start and end times
                start_time = alert.get("active_period", [{}])[0].get("start")
                end_time = alert.get("active_period", [{}])[0].get("end")

                if start_time and end_time:
                    start_datetime = datetime.fromtimestamp(int(start_time))
                    end_datetime = datetime.fromtimestamp(int(end_time))

                    # Flag as today's alert if it starts today or is ongoing today
                    is_today = start_datetime.date() == current_date
                    is_ongoing_today = start_datetime.date() <= current_date <= end_datetime.date()
                    is_today = is_today or is_ongoing_today

                    # Extract subway lines and exclude [SIR] lines
                    mentioned_lines = extract_lines_from_text(alert_text)
                    if "SIR" in mentioned_lines:
                        continue  # Skip alerts for SIR trains

                    if mentioned_lines:
                        # Count each line's alerts
                        for line in mentioned_lines:
                            line_counter[line] += 1

                        alerts.append({
                            "alert": alert_text,
                            "lines": mentioned_lines,
                            "stations": mentioned_lines,
                            "start_time": start_datetime.strftime("%A, %B %d, %I:%M %p"),
                            "end_time": end_datetime.strftime("%A, %B %d, %I:%M %p"),
                            "is_today": is_today
                        })

        # Sort alerts, placing today's alerts at the top
        alerts.sort(key=lambda x: not x["is_today"])  # `is_today` alerts first

        # Get the top 3 lines with the most alerts
        top_3_lines = line_counter.most_common(3)

        return alerts, top_3_lines

    except requests.RequestException as e:
        print(f"Error fetching subway alerts: {e}")
        return [], []
    except ValueError as e:
        print(f"Error parsing JSON: {e}")
        return [], []

@app.route('/subway-alerts', methods=['GET'])
def get_subway_alerts():
    """Endpoint to get the latest subway alerts."""
    alerts, top_3_lines = fetch_subway_alerts()
    last_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return jsonify({"alerts": alerts, "last_updated": last_updated, "top_3_lines": top_3_lines})

# Run the app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
