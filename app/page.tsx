'use client'

import { Calculator, Home, TrendingUp, DollarSign, PiggyBank, Building2, Calendar, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";

export default function HomePage() {
  const { user } = useAuth();
  const calculators = [
    {
      id: 'sell-house',
      title: 'House Selling Calculator',
      titlePt: 'Calculadora de Venda',
      description: 'Calculate all costs associated with selling your property in Portugal',
      descriptionPt: 'Descubra de forma imediata todos os custos envolvidos na venda de um imóvel em Portugal.',
      icon: Home,
      estimatedSavings: '€2,000+',
      href: '/sell-house'
    },
    {
      id: 'buy-house',
      title: 'House Buying Calculator',
      titlePt: 'Calculadora de Compra',
      description: 'IMT, stamp duty, legal fees and all costs for buying property',
      descriptionPt: 'IMT, imposto de selo, custos legais e taxas de compra calculados num só clique.',
      icon: Building2,
      estimatedSavings: '€1,500+',
      href: '/buy-house'
    },
    {
      id: 'mortgage-simulator',
      title: 'Mortgage Simulator',
      titlePt: 'Simulador de Crédito',
      description: 'Portuguese bank rates, TAEG calculations, insurance requirements',
      descriptionPt: 'Compare taxas bancárias, calcule a TAEG e verifique os seguros obrigatórios.',
      icon: TrendingUp,
      estimatedSavings: '€500+',
      href: '/mortgage-simulator'
    },
    {
      id: 'rental-investment',
      title: 'Rental Investment',
      titlePt: 'Investimento em Arrendamento',
      description: 'Calculate rental yields, expenses, and investment returns',
      descriptionPt: 'Analise a rentabilidade líquida e bruta, despesas e retorno previsto.',
      icon: PiggyBank,
      estimatedSavings: '€1,000+',
      href: '/rental-investment'
    },
    {
      id: 'property-flip',
      title: 'Property Flip Calculator',
      titlePt: 'Calculadora de Renovação',
      description: 'Renovation costs, timeline, and profit calculations',
      descriptionPt: 'Estime custos de obras, prazos de execução e margem de lucro potencial.',
      icon: Calculator,
      estimatedSavings: '€3,000+',
      href: '/property-flip'
    },
    {
      id: 'switch-house',
      title: 'House Switch Calculator',
      titlePt: 'Calculadora de Troca',
      description: 'Calculate costs when selling one property to buy another',
      descriptionPt: 'Saiba todos os custos de vender e comprar outro imóvel de forma clara e rápida.',
      icon: DollarSign,
      estimatedSavings: '€2,500+',
      href: '/switch-house'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title and Description */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl mb-6">
            Ferramentas Imobiliárias Nº1 em Portugal — Simples, Rápidas e Precisão Profissional
          </h1>
          <h2 className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Calcule, simule e analise qualquer transação ou investimento imobiliário em segundos.
            100% adaptado ao mercado português, com dados sempre atualizados.
          </h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            O Real Estate Pro Tools é a plataforma que transforma decisões imobiliárias complexas em cálculos claros e rápidos.
            Desde estimar o IMT ou o imposto de selo, até simular créditos, rendimentos de arrendamento ou custos de obras, tudo é feito em segundos — sem necessidade de instalação e com resultados fiáveis, validados por especialistas.
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

        {/* Why Choose Us Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Por que escolher Real Estate Pro Tools?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Especializado no mercado português com cálculos precisos e requisitos legais atualizados
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Especialista Mercado Português</h3>
                <p className="text-muted-foreground">
                  Taxas IMT, impostos e requisitos legais portugueses sempre atualizados
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Grau Profissional</h3>
                <p className="text-muted-foreground">
                  Cálculos precisos confiáveis por agentes imobiliários e investidores
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Rápido e gratuito</h3>
                <p className="text-muted-foreground">
                  Resultados instantâneos, sem downloads e sem complicações
                </p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Já usado por <span className="font-semibold text-foreground">muitos</span> profissionais e investidores — confiança comprovada no mercado.
              </p>
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Em Breve: Ferramentas Avançadas
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Expanda o seu negócio imobiliário com as nossas próximas ferramentas profissionais
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-card rounded-lg p-6 border border-border relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                    Em Breve
                  </span>
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      Sistema de Gestão de Clientes
                    </h3>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Organize contactos, acompanhe negociações e centralize toda a informação dos seus clientes num só lugar.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gestão de contactos e leads</li>
                  <li>• Histórico de interações</li>
                  <li>• Notas e documentos</li>
                </ul>
              </div>

              <div className="bg-card rounded-lg p-6 border border-border relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                    Em Breve
                  </span>
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      Agendamento de Visitas
                    </h3>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Marque e gira visitas a imóveis com um sistema integrado de calendário e notificações automáticas.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Calendário integrado</li>
                  <li>• Notificações automáticas</li>
                  <li>• Sincronização móvel</li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Registe-se para ser notificado e garantir acesso antecipado a estas funcionalidades.
              </p>
              {user ? (
                <Button>
                  Acesso antecipado ativo
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/auth/signup">
                    Registe-se para Acesso Antecipado
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Pricing Plans Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Planos de Utilização
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Escolha o plano que melhor se adequa às suas necessidades
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-card rounded-lg border border-border p-6 text-center flex flex-col h-full">
                <h3 className="text-xl font-semibold text-card-foreground mb-2">Utilizador Gratuito</h3>
                <p className="text-2xl font-bold text-primary mb-1">Grátis</p>
                <p className="text-sm text-muted-foreground mb-6">sem registo</p>
                <ul className="text-left space-y-3 mb-6 flex-grow">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Até 5 simulações por dia</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Todas as calculadoras</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Resultados instantâneos</span>
                  </li>
                </ul>
                <Button className="w-full mt-auto" variant="outline">
                  Começar Agora
                </Button>
              </div>

              {/* Registered Plan */}
              <div className="bg-card rounded-lg border border-border p-6 text-center flex flex-col h-full">
                <h3 className="text-xl font-semibold text-card-foreground mb-2">Utilizador Registado</h3>
                <p className="text-2xl font-bold text-primary mb-1">Grátis</p>
                <p className="text-sm text-muted-foreground mb-6">com registo</p>
                <ul className="text-left space-y-3 mb-6 flex-grow">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Até 10 simulações por dia</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Histórico de cálculos</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Suporte por email</span>
                  </li>
                </ul>
                <Button className="w-full mt-auto" asChild>
                  <Link href="/auth/signup">Registar Grátis</Link>
                </Button>
              </div>

              {/* Pro Plan */}
              <div className="bg-card rounded-lg border-2 border-primary p-6 text-center relative flex flex-col h-full">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Mais Popular
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">Utilizador Pro</h3>
                <p className="text-2xl font-bold text-primary mb-1">€9,99</p>
                <p className="text-sm text-muted-foreground mb-6">por mês</p>
                <ul className="text-left space-y-3 mb-6 flex-grow">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm font-medium">Simulações ilimitadas</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Gestão de clientes (em breve)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Acesso prioritário</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">Funcionalidades beta</span>
                  </li>
                </ul>
                <Button className="w-full mt-auto" asChild>
                  <Link href="/pricing">Upgrade para Pro</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="h-6 w-6 text-primary" />
                <span className="text-foreground font-bold text-lg">Real Estate Pro Tools</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Ferramentas profissionais de cálculo imobiliário especializadas no mercado português. 
                Simplifique os seus cálculos e concentre-se no que realmente importa.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Dados sempre atualizados</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>100% português</span>
                </div>
              </div>
            </div>
            
            {/* Calculators */}
            <div>
              <h3 className="text-foreground font-semibold mb-4">Calculadoras</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/sell-house" className="text-muted-foreground hover:text-foreground transition-colors">Venda de Casa</Link></li>
                <li><Link href="/buy-house" className="text-muted-foreground hover:text-foreground transition-colors">Compra de Casa</Link></li>
                <li><Link href="/mortgage-simulator" className="text-muted-foreground hover:text-foreground transition-colors">Simulador Crédito</Link></li>
                <li><Link href="/rental-investment" className="text-muted-foreground hover:text-foreground transition-colors">Investimento</Link></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h3 className="text-foreground font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">Sobre</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contacto</Link></li>
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Call-to-Action Final */}
          <div className="border-t border-border mt-8 pt-8">
            <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg p-8 text-center">
              <h4 className="text-2xl font-bold text-foreground mb-3">
                Tome decisões imobiliárias com confiança.
              </h4>
              <p className="text-lg text-muted-foreground mb-6">
                Experimente o Real Estate Pro Tools agora — grátis e sem compromisso.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/sell-house" 
                  className="inline-flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-md font-medium transition-colors"
                >
                  <span>Começar Agora</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center justify-center space-x-2 bg-background hover:bg-background/90 text-foreground border border-border px-8 py-3 rounded-md font-medium transition-colors"
                >
                  <span>Ver Planos Pro</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2025 Real Estate Pro Tools. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <span className="text-muted-foreground text-sm flex items-center space-x-1">
                <span>Feito em Portugal</span>
                <span>🇵🇹</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
