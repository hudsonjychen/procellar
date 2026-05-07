import threading

cachedFile = {'json': {'original':None, 'modified': None}, 'df': None}
cachedFileInfo = {'filename': '', 'size': 0, 'uploadtime': ''}
cachedProcessList = []
cachedObjectTypeList = []
cachedProcesses = {}
cachedObjectTypes = []
cachedActivities = []
cachedObjectTypeMap = {}
cachedAttrMap = []
cachedObjectAttrMap = {}
cachedProcessData = []
cachedDeletedProcesses = []
exportTasks = {}
exportTasksLock = threading.Lock()
importTasks = {}
importTasksLock = threading.Lock()