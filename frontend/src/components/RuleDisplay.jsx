// RuleDisplay.jsx
import React from 'react';
import './RuleDisplay.css';

export default function RuleDisplay({ content = [] }) {
  const getOperatorSymbol = (operator) => {
    const operatorMap = {
      'larger': '>',
      'smaller': '<',
      'equal': '==',
      'not_equal': '!=',
      'contains': '∋',
      'not_contains': '∌',
      'greater_equal': '>=',
      'less_equal': '<='
    };
    return operatorMap[operator] || operator;
  };

  const groupRules = (rules) => {
    const grouped = {};
    rules.forEach(rule => {
      if (!grouped[rule.group]) {
        grouped[rule.group] = [];
      }
      grouped[rule.group].push(rule);
    });
    return grouped;
  };

  const renderRule = (rule, index) => {
    const { name, rule: ruleData } = rule;
    const { action, entity, condition } = ruleData;

    return (
      <div key={index} className="rule-item">
        <div className="rule-expression">
          <span className="rule-name">
            {name}
          </span>
          
          <span className="separator colon">:</span>
          
          <span className={`action action-${action}`}>
            {action}
          </span>
          
          <span className="entity">
            {entity.name}
          </span>
          <span className="entity-type">({entity.type})</span>
          
          <span className="where-keyword">WHERE</span>
          
          <div className="condition-block">
            <span className="condition-entity">
              {condition.value.entity}
            </span>
            <span className="dot">.</span>
            <span className="condition-attribute">
              {condition.value.value.label}
            </span>
            <span className={`operator operator-${condition.operator}`}>
              {getOperatorSymbol(condition.operator)}
            </span>
            <span className="comparison-value">
              {condition.comparisionValue}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rule-display-container">      
      {content.length > 0 ? (
        <div className="rules-list">
          {Object.entries(groupRules(content)).map(([groupName, rules]) => (
            <div key={groupName} className="group-container">
              <div className="group-header">{groupName}</div>
              <div className="group-rules">
                {rules.map((rule, index) => renderRule(rule, index))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-rules">
          <div className="no-rules-text">No rules configured</div>
        </div>
      )}
    </div>
  );
};