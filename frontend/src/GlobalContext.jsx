import { createContext, useState, useContext, useEffect } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    {/* process data for display and backend data processing */}
    const [processData, setProcessData] = useState([]);
    {/* a process dict specifically used for auto complete component */}
    const [processAcList, setProcessAcList] = useState([]);
    {/* a generic process list */}
    const [processes, setProcesses] = useState([]);

    const [deletedProcesses, setDeletedProcesses] = useState([]);

    {/* file info */}
    const [fileInfo, setFileInfo] = useState({});
    const [uploadStatus, setUploadStatus] = useState([]);

    {/* not used */}
    const [relations, setRelations] = useState({});

    {/* operators for logic editor */}
    const [ops, setOps] = useState({});

    {/* Logic-editor operators between rules: { processName: ('and'|'or')[] } */}
    useEffect(() => {
        setOps((prevOps) => {
            const updatedOps = { ...prevOps };

            (Array.isArray(processData) ? processData : []).forEach((process) => {
                const key = process?.processName;
                if (!key) return;

                const rules = Array.isArray(process.rules) ? process.rules : null;
                if (!rules) {
                    return;
                }

                const opCount = Math.max(0, rules.length - 1);
                if (!prevOps[key] || prevOps[key].length !== opCount) {
                    updatedOps[key] = Array.from({ length: opCount }, () => "or");
                }
            });

            return updatedOps;
        });
    }, [processData]);

    {/* below is for advanced logic editor */}
    {/* logic data */}
    const [processLogicData, setProcessLogicData] = useState({})

    return (
        <GlobalContext.Provider 
            value={{
                processData, setProcessData,
                processAcList, setProcessAcList,
                processes, setProcesses,
                deletedProcesses, setDeletedProcesses,
                fileInfo, setFileInfo,
                uploadStatus, setUploadStatus,
                relations, setRelations,
                ops, setOps,
                processLogicData, setProcessLogicData
            }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => useContext(GlobalContext);