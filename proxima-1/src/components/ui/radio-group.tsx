'use client'

import * as React from 'react'

interface RadioGroupContextValue {
  value: string
  onChange: (value: string) => void
  name: string
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined)

export interface RadioGroupProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

export function RadioGroup({ 
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  className = '',
  children 
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue
  const name = React.useId()
  
  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
  }
  
  return (
    <RadioGroupContext.Provider value={{ value, onChange: handleChange, name }}>
      <div className={className} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export interface RadioGroupItemProps {
  value: string
  id?: string
  className?: string
  disabled?: boolean
}

export function RadioGroupItem({ value, id, className = '', disabled = false }: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext)
  
  if (!context) {
    throw new Error('RadioGroupItem must be used within a RadioGroup')
  }
  
  const isChecked = context.value === value
  const inputId = id || `${context.name}-${value}`
  
  return (
    <input
      type="radio"
      id={inputId}
      name={context.name}
      value={value}
      checked={isChecked}
      onChange={(e) => {
        if (e.target.checked) {
          context.onChange(value)
        }
      }}
      disabled={disabled}
      className={`h-4 w-4 text-purple-500 bg-transparent border-white/20 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 focus:ring-offset-transparent checked:bg-purple-500 checked:border-purple-500 ${className}`}
    />
  )
}