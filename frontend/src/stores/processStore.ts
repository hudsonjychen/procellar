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
}))
