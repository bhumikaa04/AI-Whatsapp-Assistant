import { useState } from 'react';
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function Features() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const features = [
    {
      title: "AI-Powered Replies",
      desc: "Generate intelligent responses instantly using AI.",
      icon: "🤖"
    },
    {
      title: "Expert System (FAQs)",
      desc: "Rule-based fallback when AI confidence is low.",
      icon: "📚"
    },
    {
      title: "Conversation Dashboard",
      desc: "View and manage all chats in one place.",
      icon: "📊"
    },
    {
      title: "Analytics & Insights",
      desc: "Track response rate, AI usage, and trends.",
      icon: "📈"
    },
    {
      title: "Easy Configuration",
      desc: "No complex setup. Manage everything visually.",
      icon: "⚙️"
    },
    {
      title: "Secure & Reliable",
      desc: "Built with security and scalability in mind.",
      icon: "🔒"
    }
  ];

  return (
    <>
      <Navbar />
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for WhatsApp Automation
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Everything you need to automate customer conversations with AI and expert systems
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => {
            const isHovered = hoveredIndex === i;
            
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`
                  bg-white p-8 rounded-xl border border-gray-200
                  transition-all duration-300 ease-out
                  ${isHovered 
                    ? 'transform scale-105 shadow-xl border-[#4F46E5]' 
                    : 'shadow-sm hover:shadow-md'
                  }
                  cursor-pointer
                `}
              >
                {/* Icon with hover effect */}
                <div className={`
                  text-3xl mb-4 transition-all duration-300
                  ${isHovered ? 'scale-110' : ''}
                `}>
                  {f.icon}
                </div>

                {/* Title with color change on hover */}
                <h3 className={`
                  font-semibold text-lg mb-3 transition-colors duration-300
                  ${isHovered ? 'text-[#4F46E5]' : 'text-gray-900'}
                `}>
                  {f.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                  {f.desc}
                </p>

                {/* Learn more link that appears on hover */}
                <div className={`
                  flex items-center text-sm font-medium transition-all duration-300
                  ${isHovered 
                    ? 'opacity-100 translate-y-0 text-[#4F46E5]' 
                    : 'opacity-0 translate-y-2'
                  }
                `}>
                  <span>Learn more</span>
                  <svg 
                    className={`w-4 h-4 ml-2 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>

                {/* Subtle border bottom effect */}
                <div className={`
                  mt-6 h-0.5 transition-all duration-300
                  ${isHovered 
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#4338CA] w-full' 
                    : 'bg-gray-100 w-1/3 mx-auto'
                  }
                `} />
              </div>
            );
          })}
        </div>

        {/* Demo section */}
        <div className="mt-24 bg-gradient-to-r from-[#4F46E5] to-[#4338CA] rounded-2xl p-12 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              See it in Action
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Watch how Replyly transforms WhatsApp conversations with AI
            </p>
            <div className="bg-black/30 rounded-xl p-8 backdrop-blur-sm">
              <div className="aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">▶️</div>
                  <p className="text-lg">Feature demo video</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to automate your WhatsApp support?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses saving hours every day with AI-powered conversations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="
              bg-[#4F46E5] text-white px-8 py-3 rounded-lg font-medium
              hover:bg-[#4338CA] transition-colors duration-300
              transform hover:scale-105 active:scale-95
            ">
              Start Free Trial
            </button>
            <button className="
              border border-gray-300 text-gray-800 px-8 py-3 rounded-lg font-medium
              hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all duration-300
              transform hover:scale-105 active:scale-95
            ">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}