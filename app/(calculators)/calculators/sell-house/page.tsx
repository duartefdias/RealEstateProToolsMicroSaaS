import type { Metadata } from 'next'
import { SellHouseCalculator } from '@/components/calculators/sell-house/SellHouseCalculator'
import { CALCULATOR_CONFIGS } from '@/lib/calculators/config'

// SEO metadata optimized for Portuguese real estate market
export const metadata: Metadata = {
  title: 'Calculadora de Custos de Venda de Casa Portugal | IMT, Comissões, Impostos',
  description: 'Calcule todos os custos de venda do seu imóvel em Portugal. IMT, comissões imobiliárias, impostos de mais-valias, liquidação de hipoteca e taxas legais. Calculadora gratuita e precisa.',
  keywords: [
    'calculadora venda casa portugal',
    'custos venda imovel',
    'imt portugal calculadora',
    'comissao imobiliaria portugal',
    'impostos venda casa',
    'mais valias imoveis portugal',
    'liquidacao hipoteca',
    'taxas notario portugal',
    'calculadora imobiliaria',
    'venda propriedade custos'
  ].join(', '),
  
  // Open Graph for social sharing
  openGraph: {
    title: 'Calculadora de Custos de Venda de Casa | Real Estate Pro Tools',
    description: 'Descubra todos os custos associados à venda do seu imóvel em Portugal. Cálculos precisos de IMT, comissões e impostos.',
    url: 'https://realestateprotools.com/calculators/sell-house',
    siteName: 'Real Estate Pro Tools',
    images: [
      {
        url: '/images/og-sell-house-calculator.jpg',
        width: 1200,
        height: 630,
        alt: 'Calculadora de Custos de Venda de Casa Portugal',
      },
    ],
    locale: 'pt_PT',
    type: 'website',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora de Custos de Venda de Casa Portugal',
    description: 'Calcule IMT, comissões imobiliárias e todos os custos de venda do seu imóvel. Gratuito e preciso.',
    images: ['/images/twitter-sell-house-calculator.jpg'],
  },
  
  // Additional SEO
  alternates: {
    canonical: 'https://realestateprotools.com/calculators/sell-house',
    languages: {
      'pt-PT': 'https://realestateprotools.com/calculators/sell-house',
      'en': 'https://realestateprotools.com/en/calculators/sell-house',
    },
  },
  
  // Schema.org structured data will be added via JSON-LD in the component
  other: {
    'geo.region': 'PT',
    'geo.country': 'Portugal',
    'geo.placename': 'Portugal',
  },
}

// Generate structured data for SEO
function generateStructuredData() {
  const calculator = CALCULATOR_CONFIGS['sell-house']
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculadora de Custos de Venda de Casa',
    description: 'Calculadora gratuita para determinar todos os custos associados à venda de imóveis em Portugal, incluindo IMT, comissões imobiliárias e impostos.',
    url: 'https://realestateprotools.com/calculators/sell-house',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'Organization',
      name: 'Real Estate Pro Tools',
      url: 'https://realestateprotools.com',
      logo: 'https://realestateprotools.com/images/logo.png',
    },
    featureList: [
      'Cálculo de IMT (Imposto Municipal sobre Transmissões)',
      'Comissões de agência imobiliária',
      'Liquidação de crédito habitação',
      'Impostos sobre mais-valias',
      'Custos legais e notariais',
      'Análise por região portuguesa'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'Property Owners, Real Estate Agents, Property Investors',
      geographicArea: {
        '@type': 'Country',
        name: 'Portugal'
      }
    },
    inLanguage: 'pt-PT',
    dateModified: new Date().toISOString(),
    isAccessibleForFree: true,
    usageInfo: 'https://realestateprotools.com/terms',
    privacyPolicy: 'https://realestateprotools.com/privacy',
  }
}

// FAQ structured data for rich snippets
function generateFAQStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Como calcular os custos de venda de casa em Portugal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Os principais custos incluem: IMT (0-8% conforme valor), comissão imobiliária (5-7%), liquidação de hipoteca, impostos sobre mais-valias (se aplicável), custos notariais (€200-800) e registo predial. Nossa calculadora considera todos estes fatores automaticamente.'
        }
      },
      {
        '@type': 'Question',
        name: 'Qual é a comissão típica das imobiliárias em Portugal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A comissão das agências imobiliárias em Portugal varia tipicamente entre 5% e 7% do valor de venda, sendo 6% a média de mercado. Esta comissão é paga pelo vendedor na maioria dos casos.'
        }
      },
      {
        '@type': 'Question',
        name: 'O que é o IMT e quando se paga na venda?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O IMT (Imposto Municipal sobre Transmissões) é pago pelo comprador, não pelo vendedor. No entanto, afeta o preço final e poder de compra. As taxas variam de 0% a 8% conforme o valor do imóvel.'
        }
      },
      {
        '@type': 'Question',
        name: 'Tenho de pagar impostos sobre mais-valias?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Depende. Se for habitação própria permanente há mais de 3 anos, está isento. Para outros casos, paga 28% sobre a diferença entre preço de venda e compra (descontando melhoramentos e custos).'
        }
      }
    ]
  }
}

export default function SellHouseCalculatorPage() {
  const structuredData = generateStructuredData()
  const faqData = generateFAQStructuredData()
  
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Início',
                item: 'https://realestateprotools.com'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Calculadoras',
                item: 'https://realestateprotools.com/calculators'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Calculadora de Venda de Casa',
                item: 'https://realestateprotools.com/calculators/sell-house'
              }
            ]
          })
        }}
      />
      
      {/* Main Calculator Component */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* SEO Content Above the Fold */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                Calculadora de Custos de Venda de Casa
              </h1>
              <p className="mt-4 text-xl text-gray-600 leading-relaxed">
                Descubra todos os custos associados à venda do seu imóvel em Portugal. 
                Cálculos precisos de <strong>IMT</strong>, <strong>comissões imobiliárias</strong>, 
                <strong>impostos sobre mais-valias</strong> e <strong>taxas legais</strong>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  ✓ Gratuito
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Atualizado 2025
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  ✓ Todas as regiões de Portugal
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  ✓ Legislação portuguesa
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Calculator Component */}
        <div className="py-12">
          <SellHouseCalculator />
        </div>
        
        {/* SEO Content Below Calculator */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* What This Calculator Does */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  O que calcula esta ferramenta?
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Comissões Imobiliárias</h3>
                      <p className="text-gray-600">Cálculo automático da comissão da agência (tipicamente 5-7% em Portugal)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Liquidação de Hipoteca</h3>
                      <p className="text-gray-600">Valor em dívida do crédito habitação e custos de liquidação antecipada</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Impostos sobre Mais-valias</h3>
                      <p className="text-gray-600">Cálculo de impostos sobre ganhos de capital (28% sobre lucro, com isenções)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold text-sm">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Custos Legais</h3>
                      <p className="text-gray-600">Taxas de notário, registo predial e documentação necessária</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Why Use This Calculator */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Por que usar nossa calculadora?
                </h2>
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">🎯 Precisão Garantida</h3>
                    <p className="text-gray-600">
                      Algoritmos baseados na legislação portuguesa atual, com taxas IMT e 
                      comissões atualizadas por região.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">📍 Específico para Portugal</h3>
                    <p className="text-gray-600">
                      Consideramos as especificidades do mercado imobiliário português, 
                      incluindo diferenças regionais.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">💰 Evite Surpresas</h3>
                    <p className="text-gray-600">
                      Conheça todos os custos antes de vender. Planeie melhor e evite 
                      custos inesperados no processo de venda.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">🚀 Rápido e Gratuito</h3>
                    <p className="text-gray-600">
                      Resultado em segundos, sem registo obrigatório. 
                      Totalmente gratuito para uso pessoal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* FAQ Section for SEO */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                Perguntas Frequentes
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Quando devo usar esta calculadora?
                  </h3>
                  <p className="text-gray-600">
                    Use antes de colocar o imóvel no mercado para definir preços, 
                    durante negociações para justificar valores, ou para planeamento 
                    financeiro pessoal.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Os resultados são vinculativos?
                  </h3>
                  <p className="text-gray-600">
                    Não. São estimativas orientativas baseadas em dados médios de mercado. 
                    Para valores oficiais, consulte sempre um profissional habilitado.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Posso usar para qualquer tipo de imóvel?
                  </h3>
                  <p className="text-gray-600">
                    Sim, funciona para habitações, apartamentos, moradias e propriedades 
                    comerciais. As taxas são ajustadas automaticamente conforme o tipo.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Como são calculadas as comissões?
                  </h3>
                  <p className="text-gray-600">
                    Usamos as médias de mercado por região (5-7%), mas pode personalizar 
                    conforme o acordo com a sua agência imobiliária.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}