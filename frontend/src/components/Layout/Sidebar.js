import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Wrench,
  LogOut,
  Plus,
  FileText,
  User,
  BarChart3,
  Users,
  Settings,
  MapPin
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'แดชบอร์ด',
      href: '/dashboard',
      icon: BarChart3,
      roles: ['admin', 'technician', 'user']
    },
    {
      name: 'แจ้งซ่อมใหม่',
      href: '/repairs/new',
      icon: Plus,
      roles: ['admin', 'technician', 'user']
    },
    {
      name: 'รายการแจ้งซ่อม',
      href: '/repairs',
      icon: FileText,
      roles: ['admin', 'technician', 'user']
    },
    {
      name: 'จัดการผู้ใช้',
      href: '/admin/users',
      icon: Users,
      roles: ['admin']
    },
    {
      name: 'จัดการสถานที่',
      href: '/admin/locations',
      icon: MapPin,
      roles: ['admin']
    },
    {
      name: 'ตั้งค่าระบบ',
      href: '/admin/settings',
      icon: Settings,
      roles: ['admin']
    },
    {
      name: 'จัดการโปรไฟล์',
      href: '/profile',
      icon: User,
      roles: ['admin', 'technician', 'user']
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

      case '/admin/locations':
        return location.pathname.startsWith('/admin/locations');

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

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-50">
      { }
      <div className="p-6 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center">
          <Wrench className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-xl font-bold text-blue-600">ระบบแจ้งซ่อม</h1>
        </Link>
      </div>

      { }
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name || user?.username}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'ผู้ดูแลระบบ' :
                user?.role === 'technician' ? 'ช่างเทคนิค' : 'ผู้ใช้งาน'}
            </p>
          </div>
        </div>
      </div>

      { }
      <nav className="flex-1 p-4 overflow-y-auto">
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
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group
                    ${current
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }
                  `}
                >
                  <Icon className={`
                    w-5 h-5 mr-3 transition-colors
                    ${current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}
                  `} />
                  {item.name}
                </Link>
              );
            })}
        </div>
      </nav>

      { }
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>ระบบออนไลน์</span>
        </div>
      </div>

      { }
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-500" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
};

export default Sidebar;