import { createContext, useState, useContext } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [processes, setProcesses] = useState([]);
    const [objectTypes, setObjectTypes] = useState([]);
    const [activities, setActivities] = useState([]);
    const [objectTypeList, setObjectTypeList] = useState([]);

    return (
        <GlobalContext.Provider 
            value={{ 
                processes, setProcesses,
                objectTypes, setObjectTypes,
                activities, setActivities,
                objectTypeList, setObjectTypeList
            }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => useContext(GlobalContext);