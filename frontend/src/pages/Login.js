import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn, Wrench } from 'lucide-react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Dynamic screen height detection for perfect mobile viewport
  useEffect(() => {
    const updateScreenHeight = () => {
      // Use visual viewport if available (better for mobile browsers)
      const height = window.visualViewport?.height || window.innerHeight;
      
      // Set CSS custom property for perfect vh on mobile
      document.documentElement.style.setProperty('--app-height', `${height}px`);
    };

    updateScreenHeight();
    window.addEventListener('resize', updateScreenHeight);
    window.addEventListener('orientationchange', updateScreenHeight);
    
    // Listen for visual viewport changes (keyboard open/close on mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateScreenHeight);
    }

    return () => {
      window.removeEventListener('resize', updateScreenHeight);
      window.removeEventListener('orientationchange', updateScreenHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateScreenHeight);
      }
    };
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-hidden"
      style={{ 
        height: 'var(--app-height, 100vh)',
        minHeight: 'var(--app-height, 100vh)'
      }}
    >


      {/* Main Container - Perfect center on all devices */}
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8" 
           style={{ 
             height: 'var(--app-height, 100vh)',
             minHeight: 'var(--app-height, 100vh)',
             paddingTop: 'env(safe-area-inset-top)',
             paddingBottom: 'env(safe-area-inset-bottom)'
           }}>
        
        {/* Container with dynamic sizing */}
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
          


          {/* Login Form Card with responsive design */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl mx-2 sm:mx-0"
               style={{
                 padding: 'clamp(1.5rem, 5vw, 2.5rem)'
               }}>
            
            {/* Title with responsive sizing - Show on all screens */}
            <div className="text-center mb-6">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 sm:mb-2">ระบบแจ้งซ่อม</h3>
              <p className="text-sm sm:text-base text-gray-600">เข้าสู่ระบบเพื่อเข้าใช้งาน</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              
              {/* Username Field with dynamic sizing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ใช้หรืออีเมล
                </label>
                <input
                  {...register('username', { required: 'กรุณากรอกชื่อผู้ใช้' })}
                  type="text"
                  className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  style={{
                    padding: 'clamp(0.75rem, 3vw, 1rem)',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    lineHeight: '1.5'
                  }}
                  placeholder="กรอกชื่อผู้ใช้"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600 flex items-start">
                    <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Field with dynamic sizing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'กรุณากรอกรหัสผ่าน' })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pr-12"
                    style={{
                      padding: 'clamp(0.75rem, 3vw, 1rem)',
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      lineHeight: '1.5'
                    }}
                    placeholder="กรอกรหัสผ่าน"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    style={{ 
                      width: '48px',
                      minHeight: '44px' // Minimum touch target
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-start">
                    <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button with perfect touch target */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center border border-transparent rounded-lg shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.98]"
                style={{
                  padding: 'clamp(0.875rem, 4vw, 1.125rem)',
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  minHeight: '48px' // Minimum touch target
                }}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;