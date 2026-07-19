import { Link } from "react-router-dom";

export default function Footer() {
  const footerLinks = {
    product: [
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Dashboard", to: "/dashboard" },
      { label: "API", to: "/api" }
    ],
    resources: [
      { label: "Documentation", to: "/docs" },
      { label: "Support", to: "/support" },
      { label: "Blog", to: "/blog" },
      { label: "Status", to: "/status" }
    ],
    company: [
      { label: "About", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Contact", to: "/contact" },
      { label: "Partners", to: "/partners" }
    ],
    legal: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Cookie Policy", to: "/cookies" },
      { label: "GDPR", to: "/gdpr" }
    ]
  };

  return (
    <footer className="bg-gray-50 border-t mt-12 sm:mt-16 lg:mt-20">
      {/* Top black line */}
      <div className="border-t border-black"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-[#4F46E5] transition-colors">
              Replyly
            </Link>
            <p className="text-gray-600 text-sm sm:text-base">
              AI-powered WhatsApp automation for modern businesses.
            </p>
            
            {/* Social Links (Optional) */}
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-[#4F46E5] transition-colors">
                <span className="sr-only">Twitter</span>𝕏
              </a>
              <a href="#" className="text-gray-400 hover:text-[#4F46E5] transition-colors">
                <span className="sr-only">LinkedIn</span>in
              </a>
              <a href="#" className="text-gray-400 hover:text-[#4F46E5] transition-colors">
                <span className="sr-only">GitHub</span>⎇
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">Product</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-gray-600 hover:text-[#4F46E5] transition-colors text-sm sm:text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">Resources</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-gray-600 hover:text-[#4F46E5] transition-colors text-sm sm:text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">Legal</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-gray-600 hover:text-[#4F46E5] transition-colors text-sm sm:text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Section with black line */}
        <div className="border-t border-black mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-600 text-sm sm:text-base text-center md:text-left">
              © {new Date().getFullYear()} Replyly. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6 text-sm sm:text-base">
              <Link to="/privacy" className="text-gray-600 hover:text-[#4F46E5] transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="text-gray-600 hover:text-[#4F46E5] transition-colors">
                Terms
              </Link>
              <Link to="/cookies" className="text-gray-600 hover:text-[#4F46E5] transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}