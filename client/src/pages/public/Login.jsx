import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from "../../components/Navbar";
import { toast } from 'react-hot-toast'; // Ensure toast is imported
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, loginWithGoogle, profileComplete, user, loading: authLoading } = useAuth();
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

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your Replyly account
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
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
                Continue with Google
              </span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({...errors, email: ''});
                    }}
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({...errors, password: ''});
                    }}
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
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                  Remember me for 30 days
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
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Signup Link */}
            <p className="mt-6 text-center text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-[#4F46E5] font-medium hover:text-[#4338CA] transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Demo credentials (optional - remove in production) */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Demo Credentials (for testing):
            </p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>Email: test@example.com</p>
              <p>Password: password123</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}