import { create } from 'zustand'
import { ProcessData, ProcessNames } from './types'

interface ProcessStore {
    /** processData stores process data */
    processData: ProcessData
    setProcessData: (data: ProcessData) => void
    resetProcessData: () => void
    /** processNames stores process names that are ready for
     * process name autocomplete */
    processNames: ProcessNames
    setProcessNames: (data: string) => void
    resetProcessNames: () => void
    editRequest: {
        type: 'rule' | 'trace'
        processName: string
        ruleName: string
        requestId: number
    } | null
    requestEditRule: (processName: string, ruleName: string) => void
    requestEditTrace: (processName: string, traceName: string) => void
    clearEditRequest: () => void
    traceEditPayload: {
        sourceProcessName: string
        sourceTraceName: string
        traceName: string
        parentProcess: string
        startOT: string[]
        startAct: string[]
        endOT: string[]
        endAct: string[]
        includeOT: string[]
        includeAct: string[]
        excludeOT: string[]
        excludeAct: string[]
        requestId: number
    } | null
    setTraceEditPayload: (payload: ProcessStore['traceEditPayload']) => void
}

export const useProcessStore = create<ProcessStore>((set) => ({
    processData: [],
    setProcessData(data) {
        set({ processData: data })
    },
    resetProcessData() {
        set({ processData: [] })
    },
    processNames: [],
    setProcessNames: (data: string) =>
        set((state) => {
            const names = state.processNames.map((name) => name.title)
            if (names.includes(data)) return {}
            return { processNames: [...state.processNames, { title: data }] }
        }),
    resetProcessNames() {
        set({ processNames: [] })
    },
    editRequest: null,
    requestEditRule(processName: string, ruleName: string) {
        set({
            editRequest: {
                type: 'rule',
                processName,
                ruleName,
                requestId: Date.now(),
            },
        })
    },
    requestEditTrace(processName: string, traceName: string) {
        set({
            editRequest: {
                type: 'trace',
                processName,
                ruleName: traceName,
                requestId: Date.now(),
            },
        })
    },
    clearEditRequest() {
        set({ editRequest: null })
    },
    traceEditPayload: null,
    setTraceEditPayload(payload) {
        set({ traceEditPayload: payload })
    },
}))
