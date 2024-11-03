import csv
import json

# Define input and output files
csv_file_path = 'stations.csv'
json_file_path = 'stations.json'

# Read the CSV and write the JSON
stations = []
with open(csv_file_path, mode='r') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    for row in csv_reader:
        station = {
            "name": row["name"],
            "short": row["short"],
            "line": row["line"]
        }
        stations.append(station)

# Save to JSON file
with open(json_file_path, mode='w') as json_file:
    json.dump(stations, json_file, indent=4)

print(f"Converted {csv_file_path} to {json_file_path}")
