import type { Metadata } from 'next';
import { SellHouseCalculator } from '@/components/calculators/sell-house/SellHouseCalculator';

export const metadata: Metadata = {
  title: 'Calculadora de Custos de Venda de Casa | Real Estate Pro Tools',
  description: 'Calcule todos os custos associados à venda da sua casa em Portugal. IMT, comissões, honorários e custos de liquidação de hipoteca. Ferramenta gratuita e precisa.',
  keywords: 'venda casa portugal, custos venda imóvel, calculadora venda casa, honorários imobiliários, liquidação hipoteca portugal, IMT portugal, comissão imobiliária',
  openGraph: {
    title: 'Calculadora de Custos de Venda de Casa - Portugal',
    description: 'Ferramenta gratuita para calcular custos de venda de imóveis em Portugal. Honorários, impostos e liquidação de hipoteca.',
    type: 'website',
    locale: 'pt_PT',
    url: 'https://realestateprotools.com/calculators/sell-house',
    siteName: 'Real Estate Pro Tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora de Custos de Venda de Casa - Portugal',
    description: 'Calcule custos de venda de imóveis: honorários, impostos e liquidação hipoteca.',
  },
  alternates: {
    canonical: 'https://realestateprotools.com/calculators/sell-house',
    languages: {
      'pt-PT': 'https://realestateprotools.com/calculators/sell-house',
      'en': 'https://realestateprotools.com/en/calculators/sell-house',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function SellHousePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* SEO Optimized Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Calculadora de Custos de Venda de Casa
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Descubra todos os custos associados à venda do seu imóvel em Portugal. 
            Calcule honorários imobiliários, custos de liquidação de hipoteca e receba 
            uma estimativa precisa da sua receita líquida.
          </p>
          
          {/* Breadcrumb for SEO */}
          <nav aria-label="breadcrumb" className="mt-6">
            <ol className="flex justify-center items-center space-x-2 text-sm text-gray-500">
              <li>
                <a href="/" className="hover:text-blue-600">
                  Real Estate Pro Tools
                </a>
              </li>
              <li className="before:content-['/'] before:mx-2">
                <a href="/calculators" className="hover:text-blue-600">
                  Calculadoras
                </a>
              </li>
              <li className="before:content-['/'] before:mx-2 text-gray-900 font-medium">
                Venda de Casa
              </li>
            </ol>
          </nav>
        </header>

        {/* Calculator Component */}
        <SellHouseCalculator />

        {/* SEO Content Section */}
        <section className="mt-16 prose prose-lg max-w-none">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Como Calcular os Custos de Venda de Casa em Portugal
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-4">
                  Honorários Imobiliários
                </h3>
                <p className="text-gray-600 mb-4">
                  Os honorários imobiliários em Portugal variam normalmente entre 5% a 6% 
                  do valor de venda, acrescidos de IVA à taxa de 23%.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Comissão da imobiliária (5-6%)</li>
                  <li>IVA sobre a comissão (23%)</li>
                  <li>Valor total dos honorários</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-4">
                  Liquidação de Hipoteca
                </h3>
                <p className="text-gray-600 mb-4">
                  Se tem hipoteca sobre o imóvel, deve considerar os custos de 
                  amortização antecipada e impostos associados.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Comissão de amortização (0,5% ou 2%)</li>
                  <li>Imposto de Selo (0,8%)</li>
                  <li>Valor em dívida da hipoteca</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <h3 className="text-xl font-medium text-blue-900 mb-3">
                💡 Dica Importante
              </h3>
              <p className="text-blue-800">
                Esta calculadora fornece estimativas baseadas nos dados que introduz. 
                Para valores finais e vinculativos, consulte sempre a sua instituição 
                bancária e a Autoridade Tributária.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section for SEO */}
        <section className="mt-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Perguntas Frequentes
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Qual a comissão típica de uma imobiliária em Portugal?
                </h3>
                <p className="text-gray-600">
                  A comissão varia entre 5% a 6% do valor de venda, acrescida de IVA (23%). 
                  Algumas imobiliárias podem negociar valores diferentes.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Quais os custos de liquidação antecipada de hipoteca?
                </h3>
                <p className="text-gray-600">
                  Para contratos de taxa variável: 0,5% do valor amortizado. Para taxa fixa: 2%. 
                  Acresce Imposto de Selo de 0,8% sobre a comissão.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Tenho de pagar mais-valias na venda?
                </h3>
                <p className="text-gray-600">
                  Se for habitação própria e permanente há mais de 3 anos, está isento. 
                  Para outras situações, as mais-valias são tributadas a 28%.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Calculadora de Custos de Venda de Casa",
            "description": "Calcule todos os custos associados à venda do seu imóvel em Portugal",
            "url": "https://realestateprotools.com/calculators/sell-house",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR"
            },
            "provider": {
              "@type": "Organization",
              "name": "Real Estate Pro Tools",
              "url": "https://realestateprotools.com"
            }
          })
        }}
      />
    </div>
  );
}