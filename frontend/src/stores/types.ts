interface Condition {
    entity: string
    attribute: string
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not in'
    value: string
}

interface EntitiesWithCondition {
    entities: string[]
    condition: Condition[]
}

interface Rule {
    ruleName: string
    parentProcess: string
    includeOT: EntitiesWithCondition
    includeAct: EntitiesWithCondition
    excludeOT: EntitiesWithCondition
    excludeAct: EntitiesWithCondition
}

type Relation =
    | {
          op: 'and' | 'or'
          left: string | Relation
          right: string | Relation
      }
    | {}

interface Process {
    processName: string
    imported: boolean
    rules: Rule[]
    relations: Relation
}

interface ProcessName {
    title: string
    inputValue?: string
}
export type ProcessData = Process[]

export type ProcessNames = ProcessName[]
