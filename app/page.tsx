import { Calculator, Home, TrendingUp, DollarSign, PiggyBank, Building2 } from "lucide-react";
import Link from "next/link";
import LanguageDropdown from "@/components/LanguageDropdown";

export default function HomePage() {
  const calculators = [
    {
      id: 'sell-house',
      title: 'House Selling Calculator',
      titlePt: 'Calculadora de Venda',
      description: 'Calculate all costs associated with selling your property in Portugal',
      descriptionPt: 'Calcule todos os custos associados à venda do seu imóvel em Portugal',
      icon: Home,
      estimatedSavings: '€2,000+',
      href: '/calculators/sell-house'
    },
    {
      id: 'buy-house',
      title: 'House Buying Calculator',
      titlePt: 'Calculadora de Compra',
      description: 'IMT, stamp duty, legal fees and all costs for buying property',
      descriptionPt: 'IMT, imposto de selo, custos legais e todas as taxas de compra',
      icon: Building2,
      estimatedSavings: '€1,500+',
      href: '/calculators/buy-house'
    },
    {
      id: 'mortgage-simulator',
      title: 'Mortgage Simulator',
      titlePt: 'Simulador de Crédito',
      description: 'Portuguese bank rates, TAEG calculations, insurance requirements',
      descriptionPt: 'Taxas bancárias portuguesas, cálculos TAEG, seguros obrigatórios',
      icon: TrendingUp,
      estimatedSavings: '€500+',
      href: '/calculators/mortgage-simulator'
    },
    {
      id: 'rental-investment',
      title: 'Rental Investment',
      titlePt: 'Investimento Arrendamento',
      description: 'Calculate rental yields, expenses, and investment returns',
      descriptionPt: 'Calcule rendimentos, despesas e retorno do investimento',
      icon: PiggyBank,
      estimatedSavings: '€1,000+',
      href: '/calculators/rental-investment'
    },
    {
      id: 'property-flip',
      title: 'Property Flip Calculator',
      titlePt: 'Calculadora de Renovação',
      description: 'Renovation costs, timeline, and profit calculations',
      descriptionPt: 'Custos de renovação, prazos e cálculos de lucro',
      icon: Calculator,
      estimatedSavings: '€3,000+',
      href: '/calculators/property-flip'
    },
    {
      id: 'switch-house',
      title: 'House Switch Calculator',
      titlePt: 'Calculadora de Troca',
      description: 'Calculate costs when selling one property to buy another',
      descriptionPt: 'Calcule custos ao vender um imóvel para comprar outro',
      icon: DollarSign,
      estimatedSavings: '€2,500+',
      href: '/calculators/switch-house'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Real Estate Pro Tools</h1>
                <p className="text-xs text-muted-foreground">Professional Real Estate Calculations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Dropdown - Hidden on mobile */}
              <div className="hidden sm:block">
                <LanguageDropdown />
              </div>
              
              {/* Auth Buttons */}
              <div className="flex items-center space-x-3">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  Sign In
                </button>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium text-sm transition-colors">
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title and Description */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl mb-6">
            Ferramentas online para profissionais imobiliários
          </h1>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Ferramenta online e completamente gratuita para calcular custos de venda, compra e investimento imobiliário, 
            simular créditos habitação, analisar rendimento de arrendamento, e muito mais. Especializada no mercado português. 
            Não requer instalação.
          </p>
        </div>
        
        {/* Calculator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculators.map((calc) => {
            const IconComponent = calc.icon;
            return (
              <Link
                key={calc.id}
                href={calc.href}
                className="bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-border hover:border-primary/50 cursor-pointer flex flex-col h-full group"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {calc.titlePt}
                    </h3>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6 leading-6 flex-grow">
                  {calc.descriptionPt}
                </p>
                
                <div className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors duration-200 mt-auto text-center group-hover:bg-primary/90">
                  Calcular Agora
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
