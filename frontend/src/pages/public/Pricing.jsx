import { useState } from 'react';
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('pro'); // Default to 'pro'

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'For small testing',
      price: '$0',
      period: '/month',
      features: [
        'Up to 100 conversations/month',
        'Basic AI replies',
        '10 FAQs limit',
        'Community support',
        '1 WhatsApp number'
      ],
      ctaText: 'Get Started',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For growing businesses',
      price: '$29',
      period: '/month',
      features: [
        'Up to 1,000 conversations/month',
        'Advanced AI replies',
        'Unlimited FAQs',
        'Priority support',
        '3 WhatsApp numbers',
        'Analytics dashboard',
        'Custom branding'
      ],
      ctaText: 'Start Free Trial',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Custom solutions',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited conversations',
        'Dedicated AI training',
        'Advanced analytics',
        '24/7 SLA support',
        'Unlimited WhatsApp numbers',
        'Custom integration',
        'Dedicated account manager'
      ],
      ctaText: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <>
      <Navbar />
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-600 text-lg">
            Choose the perfect plan for your business
          </p>
        </div>

        {/* Toggle for annual/monthly (optional) */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 inline-flex rounded-lg p-1">
            <button className="px-6 py-2 rounded-lg bg-white shadow">Monthly</button>
            <button className="px-6 py-2 rounded-lg text-gray-600">Annual (Save 20%)</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`
                  border rounded-xl p-8 cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? 'border-2 border-[#4F46E5] shadow-lg scale-[1.02]' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }
                `}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <span className="inline-block text-sm bg-[#4F46E5] text-white px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </span>
                )}

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg 
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={`
                    w-full py-3 px-4 rounded-lg font-medium transition-colors
                    ${isSelected
                      ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }
                  `}
                >
                  {plan.ctaText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Comparison table (optional) */}
        <div className="mt-20 bg-gray-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Compare all features
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-semibold text-gray-900">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-3 font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 text-gray-600">Conversations/month</td>
                  <td className="text-center py-3">100</td>
                  <td className="text-center py-3">1,000</td>
                  <td className="text-center py-3">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-gray-600">WhatsApp Numbers</td>
                  <td className="text-center py-3">1</td>
                  <td className="text-center py-3">3</td>
                  <td className="text-center py-3">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-gray-600">Support</td>
                  <td className="text-center py-3">Community</td>
                  <td className="text-center py-3">Priority</td>
                  <td className="text-center py-3">24/7 SLA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h3>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-lg mb-2">Can I switch plans later?</h4>
              <p className="text-gray-600">Yes, you can upgrade or downgrade at any time. Changes take effect immediately.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-lg mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">Pro plan comes with a 14-day free trial. No credit card required.</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}