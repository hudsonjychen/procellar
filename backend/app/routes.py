import copy
from datetime import datetime
import os
import tempfile
import threading
import time
import uuid
from flask import Blueprint, jsonify, request
import pm4py
import json
import traceback

from app.algo.entity import get_activities, get_object_count_list, get_object_types, get_processes
from app.algo.map import map_object_id_to_type, map_attribute, map_attribute_to_object
from app.algo.update import update
from app.algo.check import compatibility_check, CompatibilityError
from .cache import (
    cachedFile,
    cachedFileInfo,
    cachedProcessList,
    cachedObjectTypeList,
    cachedObjectTypes,
    cachedActivities,
    cachedObjectTypeMap,
    cachedObjectAttrMap,
    cachedAttrMap,
    cachedProcessData,
    cachedDeletedProcesses,
    exportTasks,
    exportTasksLock,
    importTasks,
    importTasksLock,
)

main = Blueprint('main', __name__)


def _validate_process_data(data):
    if not isinstance(data, list):
        return "Expected a list of objects"

    for item in data:
        if not isinstance(item, dict) or 'processName' not in item:
            return "Invalid format in data"

        has_rules = "rules" in item
        has_traces = "traces" in item
        if not has_rules and not has_traces:
            return "Each process must include either 'rules' or 'traces'"
        if has_rules and has_traces:
            return "Each process must include only one of 'rules' or 'traces'"

        if has_rules and not isinstance(item.get("rules"), list):
            return "'rules' must be a list"

        if has_traces and not isinstance(item.get("traces"), list):
            return "'traces' must be a list"

    return None


def _set_task(task_id, **kwargs):
    with exportTasksLock:
        task = exportTasks.get(task_id)
        if not task:
            return
        task.update(kwargs)
        progress = task.get("progress", 0)
        started_at = task.get("started_at")
        if started_at and progress > 0 and progress < 100:
            elapsed = time.time() - started_at
            estimated_total = elapsed / (progress / 100.0)
            task["eta_seconds"] = max(0, int(estimated_total - elapsed))
        else:
            task["eta_seconds"] = None
        task["updated_at"] = time.time()


def _is_cancelled(task_id):
    with exportTasksLock:
        task = exportTasks.get(task_id)
        return bool(task and task.get("cancel_requested"))


def _set_import_task(task_id, **kwargs):
    with importTasksLock:
        task = importTasks.get(task_id)
        if not task:
            return
        task.update(kwargs)
        progress = task.get("progress", 0)
        started_at = task.get("started_at")
        if started_at and progress > 0 and progress < 100:
            elapsed = time.time() - started_at
            estimated_total = elapsed / (progress / 100.0)
            task["eta_seconds"] = max(0, int(estimated_total - elapsed))
        else:
            task["eta_seconds"] = None
        task["updated_at"] = time.time()


def _is_import_cancelled(task_id):
    with importTasksLock:
        task = importTasks.get(task_id)
        return bool(task and task.get("cancel_requested"))


def _run_upload_pipeline(temp_path, df_path=None, progress_callback=None, should_cancel=None):
    def _progress(value, msg):
        if progress_callback:
            progress_callback(value, msg)

    _progress(10, "Reading OCEL")
    with open(temp_path, 'r', encoding='utf-8') as f:
        cachedFile['json']['original'] = json.load(f)

    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    log = pm4py.read_ocel2_json(temp_path)
    _progress(30, "Checking compatibility")

    if df_path:
        with open(df_path, 'r', encoding='utf-8') as f:
            cachedFile['df'] = json.load(f)
        compatibility_check(log, cachedFile['df'])
    else:
        cachedFile['df'] = None

    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    _progress(50, "Preparing metadata")
    cachedObjectTypeList.clear()
    cachedObjectTypeList.extend(get_object_count_list(log))

    cachedObjectTypes.clear()
    cachedObjectTypes.extend(get_object_types(log))

    cachedActivities.clear()
    cachedActivities.extend(get_activities(log))

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
    cachedProcessList.extend(process_list)

    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    _progress(75, "Building maps")
    cachedObjectTypeMap.clear()
    cachedObjectTypeMap.update(map_object_id_to_type(log))

    event_log = cachedFile['json']['original']
    cachedObjectAttrMap.clear()
    cachedObjectAttrMap.update(map_attribute_to_object(event_log))

    cachedAttrMap.clear()
    cachedAttrMap.extend(map_attribute(event_log))
    _progress(100, "Done")


def _run_process_data(data, deleted_processes, source_file=None, progress_callback=None, should_cancel=None):
    file = source_file if source_file is not None else cachedFile['json']['original']
    if file is None:
        raise ValueError("No uploaded OCEL found")
    fileCopy = copy.deepcopy(file)

    if progress_callback:
        progress_callback(10, "Reading OCEL")

    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".json", encoding="utf-8") as temp:
        json.dump(file, temp, ensure_ascii=False)
        temp_path = temp.name
    try:
        log = pm4py.read_ocel2_json(temp_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    compatibility_check(log, data)

    if progress_callback:
        progress_callback(20, "Applying rules and traces")

    update(
        object_type_map=cachedObjectTypeMap,
        object_attr_map=cachedObjectAttrMap,
        event_log=fileCopy,
        process_data=data,
        deleted_processes=deleted_processes,
        progress_callback=(
            (lambda p: progress_callback(20 + int(75 * p), "Applying rules and traces"))
            if progress_callback
            else None
        ),
        should_cancel=should_cancel,
    )
    cachedDeletedProcesses.clear()
    cachedDeletedProcesses.extend(deleted_processes)
    cachedFile['json']['modified'] = fileCopy
    if progress_callback:
        progress_callback(100, "Done")

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
        
        df_path = None
        if df:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as df_temp:
                df.save(df_temp.name)
                df_path = df_temp.name
        try:
            _run_upload_pipeline(temp_path=temp_path, df_path=df_path)
        finally:
            if df_path and os.path.exists(df_path):
                os.remove(df_path)

        return jsonify({"status": "success"}), 200
    
    except CompatibilityError as e:
        print("Fail", e)
        return jsonify({"status": "incompatible", "message": str(e)}), 422
    
    except Exception as e:
        print("Fail", e)
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)

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
        
        if not isinstance(deleted_processes, list):
            return jsonify({"error": "Expected a list of deleted data"}), 400

        validation_error = _validate_process_data(data)
        if validation_error:
            return jsonify({"error": validation_error}), 400
        
        source_file = copy.deepcopy(cachedFile['json']['original'])
        if source_file is None:
            return jsonify({"error": "No uploaded OCEL found"}), 400
        _run_process_data(data, deleted_processes, source_file=source_file)
        return jsonify({"status": "success"}), 200

    except CompatibilityError as e:
        return jsonify({"status": "incompatible", "message": str(e)}), 422

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to process file", "message": str(e)}), 500
    
@main.route('/export_file', methods=['GET'])
def export_file():
    return jsonify({
        'exportedFile': cachedFile['json']['modified']
    })


@main.route('/process_data_async', methods=['POST'])
def process_data_async():
    if not request.is_json:
        return jsonify({"error": "Request must contain JSON data"}), 400

    zipData = request.get_json()
    if not zipData:
        return jsonify({"error": "No JSON data provided"}), 400

    data = zipData.get("processData", [])
    deleted_processes = zipData.get("deletedProcesses", [])

    if not isinstance(deleted_processes, list):
        return jsonify({"error": "Expected a list of deleted data"}), 400

    validation_error = _validate_process_data(data)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    source_file = copy.deepcopy(cachedFile['json']['original'])
    if source_file is None:
        return jsonify({"error": "No uploaded OCEL found"}), 400

    task_id = str(uuid.uuid4())
    now = time.time()
    with exportTasksLock:
        exportTasks[task_id] = {
            "task_id": task_id,
            "status": "queued",
            "progress": 0,
            "message": "Queued",
            "eta_seconds": None,
            "error": None,
            "cancel_requested": False,
            "started_at": now,
            "updated_at": now,
        }

    def worker():
        try:
            _set_task(task_id, status="running", progress=5, message="Starting")
            _run_process_data(
                data,
                deleted_processes,
                source_file=source_file,
                progress_callback=lambda progress, msg: _set_task(task_id, progress=progress, message=msg),
                should_cancel=lambda: _is_cancelled(task_id),
            )
            _set_task(task_id, status="completed", progress=100, message="Completed")
        except CompatibilityError as e:
            _set_task(task_id, status="incompatible", error=str(e), message=str(e))
        except RuntimeError as e:
            if str(e) == "Processing cancelled":
                _set_task(task_id, status="cancelled", message="Cancelled by user")
            else:
                _set_task(task_id, status="failed", error=str(e), message="Processing failed")
        except Exception as e:
            traceback.print_exc()
            _set_task(task_id, status="failed", error=str(e), message="Processing failed")

    threading.Thread(target=worker, daemon=True).start()
    return jsonify({"taskId": task_id}), 202


@main.route('/process_data_status/<task_id>', methods=['GET'])
def process_data_status(task_id):
    with exportTasksLock:
        task = exportTasks.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        return jsonify(task), 200


@main.route('/process_data_cancel/<task_id>', methods=['POST'])
def process_data_cancel(task_id):
    with exportTasksLock:
        task = exportTasks.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        if task["status"] in {"completed", "failed", "cancelled", "incompatible"}:
            return jsonify({"status": task["status"]}), 200
        task["cancel_requested"] = True
        task["message"] = "Cancelling"
        task["updated_at"] = time.time()
    return jsonify({"status": "cancelling"}), 200


@main.route('/upload_async', methods=['POST'])
def upload_async():
    if "ocel" not in request.files:
        return jsonify({"error": "No File"}), 400
    file = request.files["ocel"]
    df = request.files.get("df")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as temp:
        file.save(temp.name)
        temp_path = temp.name

    df_path = None
    if df:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as df_temp:
            df.save(df_temp.name)
            df_path = df_temp.name

    filename = file.filename
    size = round(os.path.getsize(temp_path) / 1024 / 1024, 2)
    uploadtime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    task_id = str(uuid.uuid4())
    now = time.time()
    with importTasksLock:
        importTasks[task_id] = {
            "task_id": task_id,
            "status": "queued",
            "progress": 0,
            "message": "Queued",
            "eta_seconds": None,
            "error": None,
            "cancel_requested": False,
            "started_at": now,
            "updated_at": now,
            "temp_path": temp_path,
            "df_path": df_path,
            "filename": filename,
            "size": size,
            "uploadtime": uploadtime,
        }

    def worker():
        try:
            _set_import_task(task_id, status="running", progress=5, message="Starting")
            _run_upload_pipeline(
                temp_path=temp_path,
                df_path=df_path,
                progress_callback=lambda p, msg: _set_import_task(task_id, progress=p, message=msg),
                should_cancel=lambda: _is_import_cancelled(task_id),
            )
            cachedFileInfo['filename'] = filename
            cachedFileInfo['size'] = size
            cachedFileInfo['uploadtime'] = uploadtime
            _set_import_task(task_id, status="completed", progress=100, message="Completed")
        except CompatibilityError as e:
            _set_import_task(task_id, status="incompatible", error=str(e), message=str(e))
        except RuntimeError as e:
            if str(e) == "Processing cancelled":
                _set_import_task(task_id, status="cancelled", message="Cancelled by user")
            else:
                _set_import_task(task_id, status="failed", error=str(e), message="Import failed")
        except Exception as e:
            traceback.print_exc()
            _set_import_task(task_id, status="failed", error=str(e), message="Import failed")
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            if df_path and os.path.exists(df_path):
                os.remove(df_path)

    threading.Thread(target=worker, daemon=True).start()
    return jsonify({"taskId": task_id}), 202


@main.route('/upload_status/<task_id>', methods=['GET'])
def upload_status(task_id):
    with importTasksLock:
        task = importTasks.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        safe_task = {k: v for k, v in task.items() if k not in {"temp_path", "df_path"}}
        return jsonify(safe_task), 200


@main.route('/upload_cancel/<task_id>', methods=['POST'])
def upload_cancel(task_id):
    with importTasksLock:
        task = importTasks.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        if task["status"] in {"completed", "failed", "cancelled", "incompatible"}:
            return jsonify({"status": task["status"]}), 200
        task["cancel_requested"] = True
        task["message"] = "Cancelling"
        task["updated_at"] = time.time()
    return jsonify({"status": "cancelling"}), 200