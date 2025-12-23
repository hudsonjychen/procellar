import { Input } from '@mui/joy'
import { RuleInfo } from './types'

interface RuleNameInputProps {
    ruleInfo: RuleInfo
    setRuleInfo: React.Dispatch<React.SetStateAction<RuleInfo>>
}

export default function RuleNameInput({
    ruleInfo,
    setRuleInfo,
}: RuleNameInputProps) {
    return (
        <Input
            placeholder="Enter rule name..."
            value={ruleInfo.ruleName}
            onChange={(e) =>
                setRuleInfo((prev) => ({ ...prev, ruleName: e.target.value }))
            }
        />
    )
}
