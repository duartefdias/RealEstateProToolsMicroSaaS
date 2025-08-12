'use client'

import React from 'react'
import { CalculatorFieldConfig } from '@/types/calculator'
import { ConditionalField } from './InputFields'

interface FieldRendererProps {
  configs: CalculatorFieldConfig[]
  values: Record<string, any>
  onChange: (fieldId: string, value: any) => void
  errors: Record<string, string>
  disabled?: boolean
  onUpgrade?: () => void
}

export function FieldRenderer({
  configs,
  values,
  onChange,
  errors,
  disabled = false,
  onUpgrade
}: FieldRendererProps) {
  return (
    <div className="space-y-6">
      {configs.map((config) => (
        <ConditionalField
          key={config.id}
          config={config}
          value={values[config.id]}
          onChange={(value) => onChange(config.id, value)}
          error={errors[config.id]}
          disabled={disabled}
          formValues={values}
          onUpgrade={onUpgrade}
        />
      ))}
    </div>
  )
}