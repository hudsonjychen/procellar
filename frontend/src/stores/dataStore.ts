import { create } from 'zustand'
import { AttributeMapList } from '../components/Editor/types'

type EntityList = string[]

interface DataStore {
    objectTypeList: EntityList
    setObjectTypeList: (data: EntityList) => void
    activityList: EntityList
    setActivityList: (data: EntityList) => void
    attrMapList: AttributeMapList
    setAttrMapList: (data: AttributeMapList) => void
}

export const useDataStore = create<DataStore>((set) => ({
    objectTypeList: [],
    setObjectTypeList(data) {
        set({ objectTypeList: data })
    },
    activityList: [],
    setActivityList(data) {
        set({ activityList: data })
    },
    attrMapList: [],
    setAttrMapList(data) {
        set({ attrMapList: data })
    },
}))
