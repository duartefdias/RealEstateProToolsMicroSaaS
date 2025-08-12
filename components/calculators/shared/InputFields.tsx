'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InfoIcon, AlertCircle, TrendingUp, Crown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CalculatorFieldConfig } from '@/types/calculator'

interface BaseFieldProps {
  config: CalculatorFieldConfig
  value: any
  onChange: (value: any) => void
  error?: string | undefined
  disabled?: boolean
  className?: string
}

interface FieldWrapperProps extends BaseFieldProps {
  children: React.ReactNode
  showPremiumBadge?: boolean
  onUpgrade?: () => void
}

// Wrapper component for all input fields
export function FieldWrapper({ 
  config, 
  value, 
  onChange, 
  error, 
  disabled = false,
  className,
  children,
  showPremiumBadge = false,
  onUpgrade
}: FieldWrapperProps) {
  const isRequired = config.required
  const isPremium = config.tier === 'pro'
  const isRegistered = config.tier === 'registered'

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={config.id}
          className={cn(
            "text-sm font-medium",
            isRequired && "after:content-['*'] after:text-red-500 after:ml-1",
            disabled && "opacity-50"
          )}
        >
          {config.label}
        </Label>
        
        <div className="flex items-center gap-2">
          {isPremium && (
            <Badge 
              variant="outline" 
              className="border-purple-200 text-purple-700 bg-purple-50 cursor-pointer hover:bg-purple-100"
              onClick={onUpgrade}
            >
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          )}
          {isRegistered && (
            <Badge 
              variant="outline" 
              className="border-green-200 text-green-700 bg-green-50"
            >
              <Star className="w-3 h-3 mr-1" />
              Registado
            </Badge>
          )}
          {config.helpText && (
            <div className="group relative">
              <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
              <div className="invisible group-hover:visible absolute right-0 top-6 z-10 w-64 p-2 text-xs bg-gray-900 text-white rounded-md shadow-lg">
                {config.helpText}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {children}
      
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {config.helpText && !error && (
        <p className="text-xs text-gray-500">
          {config.helpText}
        </p>
      )}
    </div>
  )
}

// Currency input with Portuguese Euro formatting
export function CurrencyField({ config, value, onChange, error, disabled, className }: BaseFieldProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Format number to Portuguese currency display
  const formatCurrency = useCallback((num: number | string) => {
    const numValue = typeof num === 'string' ? parseFloat(num.replace(/[^\d.-]/g, '')) : num
    if (isNaN(numValue)) return ''
    
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue)
  }, [])

  // Parse currency string to number
  const parseCurrency = useCallback((str: string): number => {
    const cleaned = str.replace(/[^\d.-]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }, [])

  useEffect(() => {
    if (!isFocused && value !== undefined && value !== null) {
      setDisplayValue(formatCurrency(value))
    }
  }, [value, formatCurrency, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    // Parse and validate
    const numericValue = parseCurrency(inputValue)
    onChange(numericValue)
  }

  const handleFocus = () => {
    setIsFocused(true)
    // Show raw number for editing
    setDisplayValue(value?.toString() || '')
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Format for display
    if (value !== undefined && value !== null) {
      setDisplayValue(formatCurrency(value))
    }
  }

  // Market insights for property values
  const getMarketInsight = (value: number) => {
    if (config.id === 'propertyValue') {
      if (value > 1000000) return '🏰 Imóvel de luxo - mercado premium'
      if (value > 500000) return '🏡 Acima da média nacional'
      if (value > 250000) return '🏠 Valor médio de mercado'
      if (value > 100000) return '🏘️ Abaixo da média nacional'
      return '💰 Investimento acessível'
    }
    return null
  }

  const insight = value ? getMarketInsight(value) : null

  return (
    <FieldWrapper config={config} value={value} onChange={onChange} {...(error && { error })} {...(disabled !== undefined && { disabled })} {...(className && { className })}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          €
        </div>
        <Input
          id={config.id}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={config.placeholder}
          className={cn(
            "pl-8 text-right font-mono",
            error && "border-red-300 focus:border-red-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
      
      {insight && (
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          <TrendingUp className="w-3 h-3" />
          {insight}
        </div>
      )}
    </FieldWrapper>
  )
}

// Percentage input with Portuguese formatting
export function PercentageField({ config, value, onChange, error, disabled, className }: BaseFieldProps) {
  const [displayValue, setDisplayValue] = useState('')
  
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue((value * 100).toFixed(2))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    const numericValue = parseFloat(inputValue) / 100
    onChange(isNaN(numericValue) ? 0 : numericValue)
  }

  return (
    <FieldWrapper config={config} value={value} onChange={onChange} {...(error && { error })} {...(disabled !== undefined && { disabled })} {...(className && { className })}>
      <div className="relative">
        <Input
          id={config.id}
          type="number"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={config.placeholder?.replace('%', '')}
          className={cn(
            "pr-8 text-right",
            error && "border-red-300 focus:border-red-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          step="0.01"
          min={config.validation.min ? config.validation.min * 100 : undefined}
          max={config.validation.max ? config.validation.max * 100 : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          %
        </div>
      </div>
    </FieldWrapper>
  )
}

// Enhanced select field with region-specific data
export function SelectField({ config, value, onChange, error, disabled, className }: BaseFieldProps) {
  const handleValueChange = (newValue: string) => {
    onChange(newValue)
  }

  const getOptionDescription = (option: { value: string; label: string }) => {
    // Add descriptions for Portuguese regions
    if (config.id === 'location') {
      const descriptions: Record<string, string> = {
        'lisboa': 'Capital - Mercado premium, IMT mais elevado',
        'porto': 'Segunda maior cidade - Crescimento sustentado',
        'braga': 'Norte de Portugal - Preços acessíveis',
        'aveiro': 'Centro litoral - Boa relação qualidade/preço',
        'coimbra': 'Cidade universitária - Mercado estável',
        'setubal': 'Área metropolitana de Lisboa - Em crescimento',
        'faro': 'Algarve - Mercado turístico e internacional'
      }
      return descriptions[option.value]
    }
    return null
  }

  return (
    <FieldWrapper config={config} value={value} onChange={onChange} {...(error && { error })} {...(disabled !== undefined && { disabled })} {...(className && { className })}>
      <Select
        value={value || ''}
        onValueChange={handleValueChange}
        {...(disabled !== undefined && { disabled })}
      >
        <SelectTrigger 
          className={cn(
            error && "border-red-300 focus:border-red-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <SelectValue placeholder={config.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {config.options?.map((option) => {
            const description = getOptionDescription(option)
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {description && (
                    <span className="text-xs text-gray-500">{description}</span>
                  )}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </FieldWrapper>
  )
}

// Boolean field with enhanced UX
export function BooleanField({ config, value, onChange, error, disabled, className }: BaseFieldProps) {
  const handleChange = (checked: boolean) => {
    onChange(checked)
  }

  return (
    <FieldWrapper config={config} value={value} onChange={onChange} {...(error && { error })} {...(disabled !== undefined && { disabled })} {...(className && { className })}>
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id={config.id}
            checked={value || false}
            onCheckedChange={handleChange}
            disabled={disabled}
            className={cn(
              error && "border-red-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          <div className="flex-1">
            <label 
              htmlFor={config.id} 
              className={cn(
                "text-sm font-medium cursor-pointer",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {config.label}
            </label>
            {config.helpText && (
              <p className="text-xs text-gray-500 mt-1">{config.helpText}</p>
            )}
          </div>
        </div>
      </Card>
    </FieldWrapper>
  )
}

// Text input field
export function TextField({ config, value, onChange, error, disabled, className }: BaseFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <FieldWrapper config={config} value={value} onChange={onChange} {...(error && { error })} {...(disabled !== undefined && { disabled })} {...(className && { className })}>
      <Input
        id={config.id}
        type="text"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        placeholder={config.placeholder}
        className={cn(
          error && "border-red-300 focus:border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        pattern={config.validation.pattern}
        minLength={config.validation.min}
        maxLength={config.validation.max}
      />
    </FieldWrapper>
  )
}

// Number input field
export function NumberField({ config, value, onChange, error, disabled, className }: BaseFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value)
    onChange(isNaN(numValue) ? 0 : numValue)
  }

  return (
    <FieldWrapper config={config} value={value} onChange={onChange} {...(error && { error })} {...(disabled !== undefined && { disabled })} {...(className && { className })}>
      <Input
        id={config.id}
        type="number"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        placeholder={config.placeholder}
        className={cn(
          error && "border-red-300 focus:border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        min={config.validation.min}
        max={config.validation.max}
        step={config.id.includes('Rate') ? '0.01' : '1'}
      />
    </FieldWrapper>
  )
}

// Main InputField component that routes to appropriate field type
export function InputField(props: BaseFieldProps & { onUpgrade?: () => void }) {
  const { config, onUpgrade, ...otherProps } = props
  
  // Check if field should be disabled based on tier access
  const shouldShowUpgrade = config.tier === 'pro' // This would be based on user's actual tier
  const fieldDisabled = otherProps.disabled || shouldShowUpgrade

  switch (config.type) {
    case 'currency':
      return <CurrencyField {...otherProps} config={config} disabled={fieldDisabled} />
    case 'percentage':
      return <PercentageField {...otherProps} config={config} disabled={fieldDisabled} />
    case 'select':
      return <SelectField {...otherProps} config={config} disabled={fieldDisabled} />
    case 'boolean':
      return <BooleanField {...otherProps} config={config} disabled={fieldDisabled} />
    case 'number':
      return <NumberField {...otherProps} config={config} disabled={fieldDisabled} />
    case 'text':
    default:
      return <TextField {...otherProps} config={config} disabled={fieldDisabled} />
  }
}

// Conditional field wrapper - only renders if condition is met
export function ConditionalField({ 
  config, 
  formValues, 
  ...props 
}: BaseFieldProps & { 
  formValues: Record<string, any>
  onUpgrade?: () => void 
}) {
  if (!config.conditional) {
    return <InputField config={config} {...props} />
  }

  const { field, value, operator } = config.conditional
  const fieldValue = formValues[field]
  
  let shouldShow = false
  switch (operator) {
    case 'equals':
      shouldShow = fieldValue === value
      break
    case 'greaterThan':
      shouldShow = fieldValue > value
      break
    case 'lessThan':
      shouldShow = fieldValue < value
      break
  }

  if (!shouldShow) {
    return null
  }

  return <InputField config={config} {...props} />
}