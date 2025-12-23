import { Select, Option } from '@mui/joy'
import { placeholderMap } from './constants'
import { SelectedEntities } from './types'

interface EntitySelectProps {
    placeholder: 'objectTypes' | 'activities'
    type: 'includeOT' | 'includeAct' | 'excludeOT' | 'excludeAct'
    selectedEntities: SelectedEntities
    setSelectedEntities: React.Dispatch<React.SetStateAction<SelectedEntities>>
    entityList: string[]
}

export default function EntitySelect({
    placeholder,
    type,
    selectedEntities,
    setSelectedEntities,
    entityList,
}: EntitySelectProps) {
    return (
        <Select<string, true>
            multiple
            placeholder={placeholderMap[placeholder] || 'Select...'}
            sx={{ width: '12rem' }}
            value={selectedEntities[type]}
            onChange={(_, newValue) => {
                setSelectedEntities((prev) => ({
                    ...prev,
                    [type]: newValue ?? [],
                }))
            }}
        >
            {entityList.map((item) => (
                <Option key={item} value={item}>
                    {item}
                </Option>
            ))}
        </Select>
    )
}
