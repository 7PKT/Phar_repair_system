import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Wrench,
  LogOut,
  Plus,
  FileText,
  User,
  BarChart3,
  Users,
  Menu,
  X,
  Home,
  Settings,
  Bell,
  Search
} from 'lucide-react';

const Layout = ({ children, title, headerContent }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device and screen size
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = width < 768;

      setIsMobile(isMobileDevice || isSmallScreen);

      // Close mobile menu when switching to desktop
      if (width >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkDevice, 100);
    });

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Navigation functions
  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('ออกจากระบบเรียบร้อย');
      navigate('/login');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
    setIsMobileMenuOpen(false);
  };

  // Touch-friendly button component
  const TouchButton = ({ onClick, children, className = "", disabled = false, variant = "primary" }) => {
    const baseClasses = "relative overflow-hidden transition-all duration-200 active:scale-95 select-none";
    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
      secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700",
      ghost: "hover:bg-gray-100 active:bg-gray-200 text-gray-700"
    };

    const touchSizeClasses = isMobile ? "min-h-[48px] min-w-[48px]" : "min-h-[40px]";

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${touchSizeClasses}
          ${className}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          rounded-lg flex items-center justify-center
        `}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        {children}
      </button>
    );
  };

  const navigationItems = [
    {
      name: 'แดชบอร์ด',
      href: '/dashboard',
      icon: BarChart3,
      roles: ['admin', 'technician', 'user'],
      action: () => handleNavigation('/dashboard')
    },
    {
      name: 'แจ้งซ่อมใหม่',
      href: '/repairs/new',
      icon: Plus,
      roles: ['admin', 'technician', 'user'],
      action: () => handleNavigation('/repairs/new')
    },
    {
      name: 'รายการแจ้งซ่อม',
      href: '/repairs',
      icon: FileText,
      roles: ['admin', 'technician', 'user'],
      action: () => handleNavigation('/repairs')
    },
    {
      name: 'จัดการผู้ใช้',
      href: '/admin/users',
      icon: Users,
      roles: ['admin'],
      action: () => {
        if (user?.role === 'admin') {
          handleNavigation('/admin/users');
        } else {
          toast.error('ไม่มีสิทธิ์เข้าถึงหน้านี้');
        }
      }
    },
    {
      name: 'ตั้งค่าระบบ',
      href: '/admin/settings',
      icon: Settings,
      roles: ['admin'],
      action: () => {
        if (user?.role === 'admin') {
          handleNavigation('/admin/settings');
        } else {
          toast.error('ไม่มีสิทธิ์เข้าถึงหน้านี้');
        }
      }
    },
    {
      name: 'จัดการโปรไฟล์',
      href: '/profile',
      icon: User,
      roles: ['admin', 'technician', 'user'],
      action: () => handleNavigation('/profile')
    }
  ];

  const isCurrentPath = (path) => {
    switch (path) {
      case '/dashboard':
        return location.pathname === '/dashboard' || location.pathname === '/';
      case '/repairs/new':
        return location.pathname === '/repairs/new';
      case '/repairs':
        return location.pathname === '/repairs';
      case '/profile':
        return location.pathname === '/profile';
      case '/admin/users':
        return location.pathname.startsWith('/admin/users');
      case '/admin/settings':
        return location.pathname.startsWith('/admin/settings');
      default:
        return false;
    }
  };

  const isRepairRelatedPage = () => {
    return location.pathname.startsWith('/repairs/') &&
      location.pathname !== '/repairs/new' &&
      !location.pathname.startsWith('/repairs/edit');
  };

  const canAccess = (roles) => {
    return roles.includes(user?.role);
  };

  const NavContent = ({ mobile = false }) => (
    <>
      {/* Logo Section */}
      <div className={mobile ? "p-4 border-b border-gray-200" : "p-6 border-b border-gray-200"}>
        <TouchButton
          onClick={() => handleNavigation('/dashboard')}
          variant="ghost"
          className="w-full p-2 justify-start"
        >
          <Wrench className={`${mobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-600 mr-3`} />
          <h1 className={`${mobile ? 'text-lg' : 'text-xl'} font-bold text-blue-600`}>
            ระบบแจ้งซ่อม
          </h1>
        </TouchButton>
      </div>

      {/* User Info */}
      <div className={mobile ? "p-3 border-b border-gray-200" : "p-4 border-b border-gray-200"}>
        <TouchButton
          onClick={() => handleNavigation('/profile')}
          variant="ghost"
          className="w-full p-2 justify-start"
        >
          <div className={`${mobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3`}>
            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className={`${mobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900 truncate`}>
              {user?.full_name || user?.username}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'ผู้ดูแลระบบ' :
                user?.role === 'technician' ? 'ช่างเทคนิค' : 'ผู้ใช้งาน'}
            </p>
          </div>
        </TouchButton>
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 ${mobile ? 'p-3' : 'p-4'} overflow-y-auto`}>
        <div className="space-y-1">
          {navigationItems
            .filter(item => canAccess(item.roles))
            .map((item) => {
              const Icon = item.icon;
              let current = isCurrentPath(item.href);

              if (item.href === '/repairs' && isRepairRelatedPage()) {
                current = true;
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => mobile && setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group
                    ${current
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }
                  `}
                  style={{ minHeight: mobile ? '40px' : '44px' }}
                >
                  <Icon className={`
                    w-4 h-4 mr-3 transition-colors flex-shrink-0
                    ${current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}
                  `} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
        </div>
      </nav>

      {/* System Status Indicator */}
      <div className={mobile ? "p-3 border-t border-gray-200" : "p-4 border-t border-gray-200"}>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>ระบบออนไลน์</span>
        </div>
      </div>

      {/* Logout Button */}
      <div className={mobile ? "p-3 border-t border-gray-200" : "p-4 border-t border-gray-200"}>
        <button
          onClick={() => {
            logout();
            mobile && setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
          style={{ minHeight: mobile ? '40px' : '44px' }}
        >
          <LogOut className="w-4 h-4 mr-3 text-red-500 flex-shrink-0" />
          <span className="truncate">ออกจากระบบ</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-50">
          <NavContent />
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <TouchButton
              onClick={() => setIsMobileMenuOpen(true)}
              variant="ghost"
              className="p-2"
            >
              <Menu className="w-5 h-5" />
            </TouchButton>

            <TouchButton
              onClick={() => handleNavigation('/dashboard')}
              variant="ghost"
              className="flex items-center px-2"
            >
              <Wrench className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-lg font-bold text-blue-600">ระบบแจ้งซ่อม</h1>
            </TouchButton>

            <TouchButton
              onClick={() => handleNavigation('/profile')}
              variant="ghost"
              className="p-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            </TouchButton>
          </div>
        </header>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className="fixed top-0 left-0 bottom-0 w-72 max-w-sm bg-white shadow-xl transform transition-transform flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">เมนู</h2>
              <TouchButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="ghost"
                className="p-2"
              >
                <X className="w-5 h-5" />
              </TouchButton>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <NavContent mobile={true} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className="flex-1"
        style={{
          marginLeft: isMobile ? '0' : '16rem',
          paddingTop: isMobile ? '4rem' : '0'
        }}
      >
        {/* Header */}
        {title && (
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div
              className="px-4 py-3"
              style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem' }}
            >
              <div className="flex items-center justify-between">
                <h1
                  className="font-bold text-gray-900"
                  style={{
                    fontSize: isMobile ? '1.125rem' : '1.5rem',
                    lineHeight: isMobile ? '1.4' : '1.2'
                  }}
                >
                  {title}
                </h1>
                {headerContent && (
                  <div className="flex-shrink-0 ml-4">
                    {headerContent}
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main
          style={{
            padding: isMobile ? '1rem' : '1.5rem',
            minHeight: isMobile ? 'calc(100vh - 8rem)' : 'calc(100vh - 4rem)',
            paddingBottom: isMobile ? '80px' : '1.5rem'
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset">
          <div className="flex items-center justify-around py-1">
            {navigationItems
              .filter(item => canAccess(item.roles))
              .slice(0, 4) // Show only first 4 items in bottom nav
              .map((item) => {
                const Icon = item.icon;
                const current = isCurrentPath(item.href) ||
                  (item.href === '/repairs' && isRepairRelatedPage());

                return (
                  <TouchButton
                    key={item.name}
                    onClick={item.action}
                    variant="ghost"
                    className={`flex flex-col items-center px-2 py-2 transition-colors min-w-0 flex-1 ${current ? 'text-blue-600' : 'text-gray-400'
                      }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs truncate max-w-16">
                      {item.name.replace('จัดการ', '').replace('รายการ', '')}
                    </span>
                  </TouchButton>
                );
              })}
            <TouchButton
              onClick={() => setIsMobileMenuOpen(true)}
              variant="ghost"
              className="flex flex-col items-center px-2 py-2 text-gray-400 min-w-0 flex-1"
            >
              <Menu className="w-5 h-5 mb-1" />
              <span className="text-xs">เมนู</span>
            </TouchButton>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      {isMobile && !location.pathname.startsWith('/repairs/new') && (
        <div className="fixed bottom-20 right-4 z-30">
          <TouchButton
            onClick={() => handleNavigation('/repairs/new')}
            variant="ghost"
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl bg-white bg-opacity-80 backdrop-blur-sm hover:bg-opacity-90 active:bg-opacity-95 border border-white border-opacity-50"
          >
            <Plus className="w-6 h-6 text-blue-600" />
          </TouchButton>
        </div>
      )}

      {/* iOS Safe Area Support */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .safe-area-inset {
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          /* Improve touch targets */
          @media (max-width: 768px) {
            button {
              min-height: 44px;
            }
            
            /* Disable text selection on buttons */
            button {
              -webkit-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
            }
            
            /* Smooth scrolling */
            html {
              scroll-behavior: smooth;
            }
            
            /* Better touch feedback */
            button:active {
              transform: scale(0.95);
            }
          }
        `
      }} />
    </div>
  );
};

export default Layout;