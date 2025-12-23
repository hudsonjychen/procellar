import { Autocomplete, AutocompleteOption, ListItemDecorator } from '@mui/joy'
import Add from '@mui/icons-material/Add'
import { createFilterOptions } from '@mui/joy/Autocomplete'
import { RuleInfo } from './types'

interface ProcessName {
    title: string
    inputValue?: string
}
type ProcessNames = ProcessName[]

interface Props {
    ruleInfo: RuleInfo
    setRuleInfo: React.Dispatch<React.SetStateAction<RuleInfo>>
    processNames: ProcessNames
    setProcessNames: (data: string) => void
    width: string
}

const filter = createFilterOptions<ProcessName>()

const ProcessNameInput: React.FC<Props> = ({
    ruleInfo,
    setRuleInfo,
    processNames,
    setProcessNames,
    width,
}) => (
    <Autocomplete
        value={ruleInfo.parentProcess}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        freeSolo
        options={processNames}
        sx={{ width }}
        onChange={(_, newValue) => {
            if (typeof newValue === 'string') {
                setRuleInfo((prev) => ({ ...prev, parentProcess: newValue }))
                setProcessNames(newValue)
            } else if (newValue?.inputValue) {
                setProcessNames(newValue.inputValue)
            }
        }}
        filterOptions={(opts, params) => {
            const filtered = filter(opts, params)
            const { inputValue } = params
            const exists = opts.some((o) => o.title === inputValue)
            if (inputValue && !exists) {
                filtered.push({
                    inputValue,
                    title: `Add "${inputValue}"`,
                })
            }
            return filtered
        }}
        getOptionLabel={(option) =>
            typeof option === 'string'
                ? option
                : (option.inputValue ?? option.title)
        }
        renderOption={(props, option) => (
            <AutocompleteOption {...props}>
                {option.title.startsWith('Add "') && (
                    <ListItemDecorator>
                        <Add />
                    </ListItemDecorator>
                )}
                {option.title}
            </AutocompleteOption>
        )}
    />
)

export default ProcessNameInput
