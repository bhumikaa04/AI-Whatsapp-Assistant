import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// Main Home component - ONLY ONE DECLARATION
export default function HomePage() {  // Renamed to HomePage
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar/>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Automate WhatsApp Replies with AI
                </h1>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600">
                  Replyly helps businesses respond faster on WhatsApp using
                  AI-powered replies, smart FAQs, and fallback automation.
                </p>

                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    to="/signup"
                    className="bg-[#4F46E5] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4338CA] transition-colors text-center"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/features"
                    className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                  >
                    View Features
                  </Link>
                </div>
              </div>

              {/* Placeholder illustration */}
              <div className="bg-white rounded-xl shadow-md h-64 sm:h-80 lg:h-96 flex items-center justify-center text-gray-400 mt-8 lg:mt-0">
                <div className="text-center p-4">
                  <div className="text-4xl mb-4">📱</div>
                  <p className="text-lg font-medium">Dashboard Preview</p>
                  <p className="text-sm text-gray-500 mt-2">See your WhatsApp automation in action</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problems & Solutions */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">
            Solve Your Biggest WhatsApp Challenges
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Missed Messages",
                desc: "Customers expect instant replies. Delays cost trust.",
                icon: "⏰"
              },
              {
                title: "Repetitive Questions",
                desc: "Support teams waste time answering the same FAQs.",
                icon: "🔄"
              },
              {
                title: "No Visibility",
                desc: "No clear insights into conversations and performance.",
                icon: "📊"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
              How Replyly Works
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4F46E5] text-white text-2xl font-bold rounded-full mb-4">
                  1
                </div>
                <h3 className="font-semibold text-lg mb-3">Connect WhatsApp</h3>
                <p className="text-gray-600">
                  Link your WhatsApp Business number securely in minutes.
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4F46E5] text-white text-2xl font-bold rounded-full mb-4">
                  2
                </div>
                <h3 className="font-semibold text-lg mb-3">Train with FAQs</h3>
                <p className="text-gray-600">
                  Add common questions and expert rules with our visual editor.
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4F46E5] text-white text-2xl font-bold rounded-full mb-4">
                  3
                </div>
                <h3 className="font-semibold text-lg mb-3">AI Replies</h3>
                <p className="text-gray-600">
                  AI responds automatically 24/7 to customer messages.
                </p>
              </div>
            </div>
            
            {/* Visual separator for mobile */}
            <div className="sm:hidden mt-8">
              <div className="flex justify-center items-center space-x-4">
                <div className="h-0.5 w-16 bg-gray-300"></div>
                <div className="text-gray-400">→</div>
                <div className="h-0.5 w-16 bg-gray-300"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section (Optional) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-[#4F46E5]">90%</div>
              <div className="text-gray-600 text-sm mt-2">Faster response time</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-[#4F46E5]">24/7</div>
              <div className="text-gray-600 text-sm mt-2">Automation uptime</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-[#4F46E5]">78%</div>
              <div className="text-gray-600 text-sm mt-2">Questions auto-resolved</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-[#4F46E5]">50+</div>
              <div className="text-gray-600 text-sm mt-2">Happy businesses</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 text-center">
          <div className="bg-gradient-to-r from-[#4F46E5] to-[#4338CA] rounded-2xl p-8 sm:p-12 text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
              Ready to automate your WhatsApp support?
            </h2>
            <p className="text-lg opacity-90 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses saving hours every day with AI-powered conversations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-white text-[#4F46E5] px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                to="/demo"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                Request Demo
              </Link>
            </div>
            <p className="text-sm opacity-75 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}