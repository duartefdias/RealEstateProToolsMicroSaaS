'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface CalculatorContextValue {
  onCalculate?: () => Promise<void>
}

const CalculatorContext = createContext<CalculatorContextValue>({})

export const useCalculatorContext = () => {
  return useContext(CalculatorContext)
}

interface CalculatorProviderProps {
  children: ReactNode
  onCalculate?: () => Promise<void>
}

export const CalculatorProvider = ({ children, onCalculate }: CalculatorProviderProps) => {
  const contextValue: CalculatorContextValue = {
    ...(onCalculate && { onCalculate })
  }

  return (
    <CalculatorContext.Provider value={contextValue}>
      {children}
    </CalculatorContext.Provider>
  )
}