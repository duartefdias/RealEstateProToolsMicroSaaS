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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Real Estate Pro Tools</h1>
                <p className="text-xs text-gray-500">Professional Real Estate Calculations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <button className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 font-medium">
                  PT
                </button>
                <button className="px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100">
                  EN
                </button>
              </div>
              
              <div className="hidden sm:flex items-center space-x-4">
                <button className="text-gray-600 hover:text-gray-900">
                  Pricing
                </button>
                <button className="text-gray-600 hover:text-gray-900">
                  Sign In
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Professional Real Estate 
              <span className="text-blue-600"> Calculations</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              Accurate, localized calculations for the Portuguese market. Get precise cost estimates, 
              tax calculations, and investment analysis for all your real estate transactions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Start Calculating
              </button>
              <button className="text-lg font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </button>
            </div>
            
            <div className="mt-8 flex justify-center items-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>5 Free calculations daily</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Portuguese market specialized</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
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
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Choose Your Calculator
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Professional tools for every real estate scenario
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {calculators.map((calc) => {
              const IconComponent = calc.icon;
              return (
                <div
                  key={calc.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {calc.title}
                      </h3>
                      <p className="text-sm text-gray-500">{calc.titlePt}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 leading-6">
                    {calc.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Save {calc.estimatedSavings}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      ★★★★★ (4.8)
                    </div>
                  </div>
                  
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                    Calculate Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-blue-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Why Real Estate Professionals Choose Us
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              Specialized for the Portuguese market with accurate tax calculations and legal requirements
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Accurate Calculations</h3>
                <p className="text-gray-600">
                  Up-to-date Portuguese tax rates, fees, and legal requirements built-in
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Save Time & Money</h3>
                <p className="text-gray-600">
                  Avoid costly mistakes with professional-grade calculation tools
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Reports</h3>
                <p className="text-gray-600">
                  Generate detailed breakdowns for clients and professional documentation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="h-6 w-6 text-blue-400" />
                <span className="text-white font-bold text-lg">Real Estate Pro Tools</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Professional Real Estate Calculations & Client Management - Simplified. 
                Specialized for the Portuguese market.
              </p>
              <div className="text-sm text-gray-500">
                www.realestateprotools.com
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Calculators</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">House Selling</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">House Buying</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Mortgage Simulator</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Rental Investment</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Real Estate Pro Tools. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <span className="text-gray-400 text-sm">Made in Portugal 🇵🇹</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
