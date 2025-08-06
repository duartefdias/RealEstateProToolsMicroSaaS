export interface SellHouseInputs {
  valorVenda: number;
  comissaoPercentagem: number;
  valorHipoteca: number;
  tipoTaxa: 'variavel' | 'fixa';
}

export interface SellHouseResults {
  inputs: SellHouseInputs;
  honorarios: {
    honorariosRemax: number;
    ivaHonorarios: number;
    totalHonorarios: number;
  };
  liquidacao: {
    valorHipoteca: number;
    custoAmortizacao: number;
    impostoSelo: number;
    totalLiquidacao: number;
  };
  receitaLiquida: number;
  custoTotal: number;
}

export const calculateSellHouseCosts = (inputs: SellHouseInputs): SellHouseResults => {
  const { valorVenda, comissaoPercentagem, valorHipoteca, tipoTaxa } = inputs;

  // Convert percentage from UI (e.g., 5.5) to decimal (0.055)
  const comissaoDecimal = comissaoPercentagem / 100;

  // Calculate honorários (commission fees)
  const honorariosRemax = valorVenda * comissaoDecimal;
  const ivaHonorarios = honorariosRemax * 0.23;
  const totalHonorarios = honorariosRemax + ivaHonorarios;

  // Calculate liquidação da hipoteca (mortgage settlement)
  const custoAmortizacaoPercentagem = tipoTaxa === 'variavel' ? 0.005 : 0.02; // 0.5% or 2%
  const custoAmortizacao = valorHipoteca * custoAmortizacaoPercentagem;
  const impostoSelo = custoAmortizacao * 0.008; // 0.8% stamp duty on amortization cost
  const totalLiquidacao = valorHipoteca + custoAmortizacao + impostoSelo;

  // Calculate net revenue
  const custoTotal = totalHonorarios + totalLiquidacao;
  const receitaLiquida = valorVenda - custoTotal;

  return {
    inputs,
    honorarios: {
      honorariosRemax,
      ivaHonorarios,
      totalHonorarios,
    },
    liquidacao: {
      valorHipoteca,
      custoAmortizacao,
      impostoSelo,
      totalLiquidacao,
    },
    receitaLiquida,
    custoTotal,
  };
};

// Helper function to format currency for display
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Helper function to format percentage for display
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};