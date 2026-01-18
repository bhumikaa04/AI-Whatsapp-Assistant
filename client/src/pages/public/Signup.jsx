import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from "../../components/Navbar";
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { signup, loginWithGoogle, profileComplete, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Watch for Auth state changes to handle redirection
  useEffect(() => {
    if (!authLoading && user) {
      if (profileComplete) {
        navigate('/dashboard');
      } else {
        navigate('/dashboard/profile');
      }
    }
  }, [user, profileComplete, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'password') {
      let strength = 0;
      if (value.length >= 8) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      // Logic handled by useEffect once this succeeds
      await signup(formData.email, formData.password, formData.name);
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const colors = ['bg-gray-200', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    return colors[passwordStrength] || 'bg-gray-200';
  };

  const getPasswordStrengthText = () => {
    const texts = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return texts[passwordStrength] || '';
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-600">
              Start automating your WhatsApp support in minutes
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Google Signup Button */}
            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">
                Sign up with Google
              </span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Or sign up with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password Strength */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 4 ? 'text-green-600' :
                        passwordStrength === 3 ? 'text-blue-600' :
                        passwordStrength === 2 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                        style={{ width: `${passwordStrength * 25}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.confirmPassword}
                  </p>
                )}
                
                {/* Password match indicator */}
                {formData.password && formData.confirmPassword && !errors.confirmPassword && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  className="h-4 w-4 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300 rounded mt-1"
                  disabled={isLoading}
                  required
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#4F46E5] hover:text-[#4338CA]">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#4F46E5] hover:text-[#4338CA]">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#4F46E5] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#4338CA] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-6 text-center text-gray-600 text-sm">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-[#4F46E5] font-medium hover:text-[#4338CA] transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Features list (optional) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-white rounded-xl shadow-sm">
              <div className="text-[#4F46E5] font-bold mb-1">14-day trial</div>
              <div className="text-gray-600">No credit card required</div>
            </div>
            <div className="text-center p-3 bg-white rounded-xl shadow-sm">
              <div className="text-[#4F46E5] font-bold mb-1">Free forever</div>
              <div className="text-gray-600">Up to 100 conversations/month</div>
            </div>
            <div className="text-center p-3 bg-white rounded-xl shadow-sm">
              <div className="text-[#4F46E5] font-bold mb-1">24/7 support</div>
              <div className="text-gray-600">Email & chat support</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}