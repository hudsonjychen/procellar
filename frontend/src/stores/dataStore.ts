import { create } from "zustand";
import { AttributeMapList } from "../components/StandardEditor/types";

type EntityList = string[];
type ObjectTypeCount = { name: string; count: number };
type ObjectTypeOverview = ObjectTypeCount[];

interface DataStore {
  objectTypeList: EntityList;
  setObjectTypeList: (data: EntityList) => void;
  activityList: EntityList;
  setActivityList: (data: EntityList) => void;
  attrMapList: AttributeMapList;
  setAttrMapList: (data: AttributeMapList) => void;
  objectTypeOverview: ObjectTypeOverview;
  setObjectTypeOverview: (data: ObjectTypeOverview) => void;
}

export const useDataStore = create<DataStore>((set) => ({
  objectTypeList: [],
  setObjectTypeList(data) {
    set({ objectTypeList: data });
  },
  activityList: [],
  setActivityList(data) {
    set({ activityList: data });
  },
  attrMapList: [],
  setAttrMapList(data) {
    set({ attrMapList: data });
  },
  objectTypeOverview: [],
  setObjectTypeOverview(data) {
    set({ objectTypeOverview: data });
  },
}));
