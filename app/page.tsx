import { Calculator, Home, TrendingUp, DollarSign, PiggyBank, Building2 } from "lucide-react";

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
              <div className="flex items-center space-x-2 text-sm">
                <button className="px-3 py-1 rounded-md bg-primary/10 text-primary font-medium">
                  PT
                </button>
                <button className="px-3 py-1 rounded-md text-muted-foreground hover:bg-muted">
                  EN
                </button>
              </div>
              
              <div className="hidden sm:flex items-center space-x-4">
                <button className="text-muted-foreground hover:text-foreground">
                  Pricing
                </button>
                <button className="text-muted-foreground hover:text-foreground">
                  Sign In
                </button>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Professional Real Estate 
              <span className="text-primary"> Calculations</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-3xl mx-auto">
              Accurate, localized calculations for the Portuguese market. Get precise cost estimates, 
              tax calculations, and investment analysis for all your real estate transactions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button className="rounded-md bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Start Calculating
              </button>
              <button className="text-lg font-semibold leading-6 text-foreground">
                Learn more <span aria-hidden="true">→</span>
              </button>
            </div>
            
            <div className="mt-8 flex justify-center items-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>5 Free calculations daily</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Portuguese market specialized</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Used by 1000+ professionals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Choose Your Calculator
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Professional tools for every real estate scenario
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {calculators.map((calc) => {
              const IconComponent = calc.icon;
              return (
                <div
                  key={calc.id}
                  className="bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-border hover:border-primary/50"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        {calc.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{calc.titlePt}</p>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4 leading-6">
                    {calc.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Save {calc.estimatedSavings}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ★★★★★ (4.8)
                    </div>
                  </div>
                  
                  <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors duration-200">
                    Calculate Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
              Why Real Estate Professionals Choose Us
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Specialized for the Portuguese market with accurate tax calculations and legal requirements
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Accurate Calculations</h3>
                <p className="text-muted-foreground">
                  Up-to-date Portuguese tax rates, fees, and legal requirements built-in
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Save Time & Money</h3>
                <p className="text-muted-foreground">
                  Avoid costly mistakes with professional-grade calculation tools
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-accent/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Professional Reports</h3>
                <p className="text-muted-foreground">
                  Generate detailed breakdowns for clients and professional documentation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="h-6 w-6 text-primary" />
                <span className="text-foreground font-bold text-lg">Real Estate Pro Tools</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Professional Real Estate Calculations & Client Management - Simplified. 
                Specialized for the Portuguese market.
              </p>
              <div className="text-sm text-muted-foreground">
                www.realestateprotools.com
              </div>
            </div>
            
            <div>
              <h3 className="text-foreground font-medium mb-4">Calculators</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/calculators/sell-house" className="text-muted-foreground hover:text-foreground">House Selling</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">House Buying</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Mortgage Simulator</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Rental Investment</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-foreground font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 Real Estate Pro Tools. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <span className="text-muted-foreground text-sm">Made in Portugal 🇵🇹</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
