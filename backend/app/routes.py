import copy
from datetime import datetime
import os
import tempfile
from flask import Blueprint, jsonify, request
import pm4py
import json
import traceback

from app.algo.entity import get_activities, get_object_count_list, get_object_types, get_processes
from app.algo.map import map_object_id_to_type, map_attribute, map_attribute_to_object
from app.algo.update import update
from app.algo.check import compatibility_check, CompatibilityError
from .cache import cachedFile, cachedFileInfo, cachedProcessList, cachedObjectTypeList, cachedObjectTypes, cachedActivities, cachedObjectTypeMap, cachedObjectAttrMap, cachedAttrMap, cachedProcessData, cachedDeletedProcesses

main = Blueprint('main', __name__)

@main.route('/upload', methods=['POST'])
def upload():
    if "ocel" not in request.files:
        return jsonify({"error": "No File"}), 400
    file = request.files["ocel"]

    df = request.files.get("df")
    cachedFile['df'] = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as temp:
            file.save(temp.name)
            temp_path = temp.name
        
        filename = file.filename
        size = round(os.path.getsize(temp_path) / 1024 / 1024, 2)
        uploadtime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        cachedFileInfo['filename'] = filename
        cachedFileInfo['size'] = size
        cachedFileInfo['uploadtime'] = uploadtime
        
        with open(temp_path, 'r') as f:
            cachedFile['json']['original'] = json.load(f)

        log = pm4py.read_ocel2_json(temp_path)

        if df:
            df.seek(0)
            cachedFile['df'] = json.load(df)
            compatibility_check(log, cachedFile['df'])

        cachedObjectTypeList.clear()
        cachedObjectTypeList.extend(get_object_count_list(log)) # displayed on the left side

        cachedObjectTypes.clear()
        cachedObjectTypes.extend(get_object_types(log)) # object type options for editor

        cachedActivities.clear()
        cachedActivities.extend(get_activities(log)) # activity options for editor

        cachedProcessData.clear()
        cachedProcessList.clear()
        process_list = [{'name': p, 'imported': True} for p in get_processes(log)]
        if cachedFile['df']:
            df_process_list = [{'name': p['processName'], 'imported': False} for p in cachedFile['df']]
            index = {item["name"]: item for item in process_list}
            for item in df_process_list:
                if item["name"] not in index:
                    process_list.append(item)
            cachedProcessData.extend(cachedFile['df'])
        cachedProcessList.extend(process_list) # displayed on the left side
        
        print(cachedProcessData)
        print(cachedProcessList)
        
        cachedObjectTypeMap.clear()
        cachedObjectTypeMap.update(map_object_id_to_type(log))

        event_log = cachedFile['json']['original']

        cachedObjectAttrMap.clear()
        cachedObjectAttrMap.update(map_attribute_to_object(event_log))

        cachedAttrMap.clear()
        cachedAttrMap.extend(map_attribute(event_log))

        return jsonify({"status": "success"}), 200
    
    except CompatibilityError as e:
        print("Fail", e)
        return jsonify({"status": "incompatible", "message": str(e)}), 422
    
    except Exception as e:
        print("Fail", e)
        return jsonify({"status": "error", "message": str(e)}), 500

@main.route('/get_data', methods=['GET'])
def get_data():
    return jsonify({
        'objectTypeList': cachedObjectTypeList,
        'processList': cachedProcessList,
        'objectTypes': cachedObjectTypes,
        'activities': cachedActivities,
        'attributes': cachedAttrMap,
        'fileInfo': cachedFileInfo,
        'processData': cachedProcessData
    })

@main.route('/process_data', methods=['POST'])
def process_data():

    try:
        if not request.is_json:
            return jsonify({"error": "Request must contain JSON data"}), 400
        
        zipData = request.get_json()
        
        if not zipData:
            return jsonify({"error": "No JSON data provided"}), 400
        
        data = zipData.get("processData", [])
        deleted_processes = zipData.get("deletedProcesses", [])
        
        print("Received data:", data, deleted_processes)
        
        if not isinstance(data, list):
            return jsonify({"error": "Expected a list of objects"}), 400
        
        if not isinstance(deleted_processes, list):
            return jsonify({"error": "Expected a list of deleted data"}), 400
        
        for item in data:
            if not isinstance(item, dict) or 'processName' not in item:
                return jsonify({"error": "Invalid format in data"}), 400
        
        file = cachedFile['json']['original']
        fileCopy = copy.deepcopy(file)

        cachedDeletedProcesses.clear()
        cachedDeletedProcesses.extend(deleted_processes)
        
        update(object_type_map=cachedObjectTypeMap, object_attr_map=cachedObjectAttrMap, event_log=fileCopy, process_data=data, deleted_processes=cachedDeletedProcesses)
        cachedFile['json']['modified'] = fileCopy
        return jsonify({"status": "success"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to process file", "message": str(e)}), 500
    
@main.route('/export_file', methods=['GET'])
def export_file():
    return jsonify({
        'exportedFile': cachedFile['json']['modified']
    })