import { AttributeType, Operator } from './types'

export const operatorMap: Record<AttributeType, Operator[]> = {
    string: ['==', '!=', 'in', 'not in'],
    int64: ['==', '!=', '>', '>=', '<', '<='],
    float64: ['==', '!=', '>', '>=', '<', '<='],
}

export const placeholderMap = {
    objectTypes: 'Object Types...',
    activities: 'Activities...',
    entity: 'Entity...',
    attribute: 'Attribute...',
    operator: 'Operator...',
}
