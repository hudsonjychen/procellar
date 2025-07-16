import { createContext, useState, useContext } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    {/* process data for display and backend data processing */}
    const [processData, setProcessData] = useState([]);
    {/* a process dict specifically used for auto complete component */}
    const [processAcList, setProcessAcList] = useState([]);
    {/* a generic process list */}
    const [processes, setProcesses] = useState([]);
    const [objectTypes, setObjectTypes] = useState([]);
    const [activities, setActivities] = useState([]);
    const [objectTypeList, setObjectTypeList] = useState([]);

    const [relations, setRelations] = useState({});

    return (
        <GlobalContext.Provider 
            value={{
                processData, setProcessData,
                processAcList, setProcessAcList,
                processes, setProcesses,
                objectTypes, setObjectTypes,
                activities, setActivities,
                objectTypeList, setObjectTypeList,
                relations, setRelations
            }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => useContext(GlobalContext);