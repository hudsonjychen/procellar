import { Input } from "@mui/joy";
import { RuleInfo } from "./types";

interface RuleNameInputProps {
  ruleInfo: RuleInfo;
  setRuleInfo: React.Dispatch<React.SetStateAction<RuleInfo>>;
  text: string;
}

export default function RuleNameInput({
  ruleInfo,
  setRuleInfo,
  text,
}: RuleNameInputProps) {
  return (
    <Input
      placeholder={text}
      value={ruleInfo.ruleName}
      onChange={(e) =>
        setRuleInfo((prev) => ({ ...prev, ruleName: e.target.value }))
      }
    />
  );
}
