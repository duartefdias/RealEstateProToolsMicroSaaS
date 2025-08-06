'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  calculateSellHouseCosts, 
  formatCurrency, 
  formatPercentage,
  type SellHouseInputs, 
  type SellHouseResults 
} from '@/lib/calculators/sell-house';
import { Calculator, Home, Euro, AlertCircle, TrendingUp } from 'lucide-react';

export function SellHouseCalculator() {
  const [inputs, setInputs] = useState<SellHouseInputs>({
    valorVenda: 0,
    comissaoPercentagem: 5.5,
    valorHipoteca: 0,
    tipoTaxa: 'variavel',
  });
  
  const [results, setResults] = useState<SellHouseResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!inputs.valorVenda || inputs.valorVenda <= 0) {
      newErrors.valorVenda = 'Valor de venda é obrigatório e deve ser maior que 0';
    }
    
    if (!inputs.comissaoPercentagem || inputs.comissaoPercentagem < 0 || inputs.comissaoPercentagem > 15) {
      newErrors.comissaoPercentagem = 'Comissão deve estar entre 0% e 15%';
    }
    
    if (inputs.valorHipoteca < 0) {
      newErrors.valorHipoteca = 'Valor da hipoteca não pode ser negativo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
    if (!validateInputs()) {
      return;
    }
    
    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    setTimeout(() => {
      const calculationResults = calculateSellHouseCosts(inputs);
      setResults(calculationResults);
      setIsCalculating(false);
    }, 300);
  };

  const handleInputChange = (field: keyof SellHouseInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClear = () => {
    setInputs({
      valorVenda: 0,
      comissaoPercentagem: 5.5,
      valorHipoteca: 0,
      tipoTaxa: 'variavel',
    });
    setResults(null);
    setErrors({});
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Input Form */}
      <Card className="shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Calculator className="h-6 w-6 text-blue-600" />
            Dados do Imóvel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Valor de Venda */}
          <div className="space-y-2">
            <Label htmlFor="valorVenda" className="text-sm font-medium">
              Valor de Venda *
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="valorVenda"
                type="number"
                placeholder="Ex: 350000"
                className={`pl-10 ${errors.valorVenda ? 'border-red-500' : ''}`}
                value={inputs.valorVenda || ''}
                onChange={(e) => handleInputChange('valorVenda', parseFloat(e.target.value) || 0)}
              />
            </div>
            {errors.valorVenda && (
              <p className="text-sm text-red-600">{errors.valorVenda}</p>
            )}
            <p className="text-xs text-gray-500">Valor estimado de venda do imóvel</p>
          </div>

          {/* Comissão */}
          <div className="space-y-2">
            <Label htmlFor="comissao" className="text-sm font-medium">
              Comissão Imobiliária (%)
            </Label>
            <Input
              id="comissao"
              type="number"
              step="0.1"
              min="0"
              max="15"
              placeholder="Ex: 5.5"
              className={errors.comissaoPercentagem ? 'border-red-500' : ''}
              value={inputs.comissaoPercentagem || ''}
              onChange={(e) => handleInputChange('comissaoPercentagem', parseFloat(e.target.value) || 0)}
            />
            {errors.comissaoPercentagem && (
              <p className="text-sm text-red-600">{errors.comissaoPercentagem}</p>
            )}
            <p className="text-xs text-gray-500">Percentagem da comissão (normalmente 5-6%)</p>
          </div>

          {/* Valor da Hipoteca */}
          <div className="space-y-2">
            <Label htmlFor="valorHipoteca" className="text-sm font-medium">
              Valor da Hipoteca
            </Label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="valorHipoteca"
                type="number"
                placeholder="Ex: 200000 (0 se não tem hipoteca)"
                className={`pl-10 ${errors.valorHipoteca ? 'border-red-500' : ''}`}
                value={inputs.valorHipoteca || ''}
                onChange={(e) => handleInputChange('valorHipoteca', parseFloat(e.target.value) || 0)}
              />
            </div>
            {errors.valorHipoteca && (
              <p className="text-sm text-red-600">{errors.valorHipoteca}</p>
            )}
            <p className="text-xs text-gray-500">Valor em dívida da hipoteca (deixe 0 se não tem)</p>
          </div>

          {/* Tipo de Taxa */}
          {inputs.valorHipoteca > 0 && (
            <div className="space-y-2">
              <Label htmlFor="tipoTaxa" className="text-sm font-medium">
                Tipo de Taxa da Hipoteca
              </Label>
              <Select 
                value={inputs.tipoTaxa} 
                onValueChange={(value: 'variavel' | 'fixa') => handleInputChange('tipoTaxa', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de taxa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variavel">Taxa Variável (0,5%)</SelectItem>
                  <SelectItem value="fixa">Taxa Fixa (2%)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Tipo de taxa do seu contrato de hipoteca</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleCalculate} 
              disabled={isCalculating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isCalculating ? 'A calcular...' : 'Calcular Custos'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={isCalculating}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Main Result */}
          <Card className="shadow-lg bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-2xl text-green-800">
                  <TrendingUp className="h-6 w-6" />
                  Receita Líquida
                </span>
                <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                  Resultado Final
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-800 mb-2">
                {formatCurrency(results.receitaLiquida)}
              </div>
              <p className="text-green-700">
                Valor que receberá após todos os custos da venda
              </p>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Discriminação de Custos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Valor de Venda</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(results.inputs.valorVenda)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Custos Totais</p>
                  <p className="text-xl font-semibold text-red-600">
                    -{formatCurrency(results.custoTotal)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Receita Líquida</p>
                  <p className="text-xl font-semibold text-green-600">
                    {formatCurrency(results.receitaLiquida)}
                  </p>
                </div>
              </div>

              {/* Honorários */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">
                  Honorários Imobiliários
                  <span className="float-right text-red-600">
                    {formatCurrency(results.honorarios.totalHonorarios)}
                  </span>
                </h3>
                <div className="ml-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Comissão da Imobiliária ({formatPercentage(results.inputs.comissaoPercentagem)}):</span>
                    <span>{formatCurrency(results.honorarios.honorariosRemax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA sobre Comissão (23%):</span>
                    <span>{formatCurrency(results.honorarios.ivaHonorarios)}</span>
                  </div>
                </div>
              </div>

              {/* Liquidação da Hipoteca */}
              {results.liquidacao.valorHipoteca > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Liquidação da Hipoteca
                    <span className="float-right text-red-600">
                      {formatCurrency(results.liquidacao.totalLiquidacao)}
                    </span>
                  </h3>
                  <div className="ml-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Capital em Dívida:</span>
                      <span>{formatCurrency(results.liquidacao.valorHipoteca)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Comissão de Amortização ({results.inputs.tipoTaxa === 'variavel' ? '0,5%' : '2%'}):
                      </span>
                      <span>{formatCurrency(results.liquidacao.custoAmortizacao)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Imposto de Selo (0,8%):</span>
                      <span>{formatCurrency(results.liquidacao.impostoSelo)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Importante:</strong> Estes são valores estimativos baseados nos dados introduzidos. 
              Para valores finais e vinculativos, consulte sempre a sua instituição bancária e a 
              Autoridade Tributária. Não estão incluídos outros custos como mais-valias, 
              obras de beneficiação, ou custos notariais adicionais.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}