import tempfile
from flask import Blueprint, jsonify, request
import pm4py
import json
import traceback

from app.algo.entity import get_activities, get_object_list, get_object_types, get_processes
from app.algo.map import map_object_id_to_type
from app.algo.update import update
from .cache import cachedFile, cachedProcessList, cachedObjectTypeList, cachedObjectTypes, cachedActivities, cachedObjectTypeMap

main = Blueprint('main', __name__)

@main.route('/upload', methods=['POST'])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No File"}), 400
    file = request.files["file"]

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as temp:
            file.save(temp.name)
            temp_path = temp.name
        
        with open(temp_path, 'r') as f:
            cachedFile['json'] = json.load(f)

        log = pm4py.read_ocel2_json(temp_path)

        cachedObjectTypeList.clear()
        cachedObjectTypeList.extend(get_object_list(log)) # displayed on the left side

        cachedProcessList.clear()
        cachedProcessList.extend(get_processes(log)) # displayed on the left side

        cachedObjectTypes.clear()
        cachedObjectTypes.extend(get_object_types(log)) # object type options for editor

        cachedActivities.clear()
        cachedActivities.extend(get_activities(log)) # activity options for editor
        
        global cachedObjectTypeMap
        cachedObjectTypeMap = map_object_id_to_type(log)
        print(cachedObjectTypeMap)

        return jsonify({"status": "success"}), 200
    
    except Exception as e:
        print("Fail", e)
        return jsonify({"status": "error", "message": str(e)}), 500

@main.route('/get_data', methods=['GET'])
def get_data():
    return jsonify({
        'objectTypeList': cachedObjectTypeList,
        'processList': cachedProcessList,
        'objectTypes': cachedObjectTypes,
        'activities': cachedActivities
    })

@main.route('/process_data', methods=['POST'])
def process_data():

    try:
        if not request.is_json:
            return jsonify({"error": "Request must contain JSON data"}), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        print("Received data:", data)
        
        if not isinstance(data, list):
            return jsonify({"error": "Expected a list of objects"}), 400
        
        for item in data:
            if not isinstance(item, dict) or 'processName' not in item:
                return jsonify({"error": "Invalid format in data"}), 400
        
        update(object_type_map=cachedObjectTypeMap, event_log=cachedFile['json'], process_data=data)
        return jsonify({"status": "success"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to process file", "message": str(e)}), 500
    
@main.route('/export_file', methods=['GET'])
def export_file():
    return jsonify({
        'exportedFile': cachedFile['json']
    })