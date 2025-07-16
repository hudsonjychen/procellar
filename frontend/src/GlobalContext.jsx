import { createContext, useState, useContext, useEffect } from "react";

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

    {/* relations for logic editor */}
    const [relations, setRelations] = useState({});
    const [ops, setOps] = useState({});

    useEffect(() => {

        setOps(prevOps => {
            const updatedOps = { ...prevOps };

            processData.forEach(process => {
                const key = process.processName;

                if (!prevOps[key] || prevOps[key].length !== process.rules.length - 1) {
                    updatedOps[key] = Array.from({ length: process.rules.length - 1 }, () => 'or');
                }
            });

            return updatedOps;
        });
    }, [processData])

    return (
        <GlobalContext.Provider 
            value={{
                processData, setProcessData,
                processAcList, setProcessAcList,
                processes, setProcesses,
                objectTypes, setObjectTypes,
                activities, setActivities,
                objectTypeList, setObjectTypeList,
                relations, setRelations,
                ops, setOps
            }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => useContext(GlobalContext);