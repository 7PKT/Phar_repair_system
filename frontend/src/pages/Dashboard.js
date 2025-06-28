import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Wrench,
  Tag,
  Activity,
  RefreshCw,
  Smartphone,
  Monitor,
  Plus,
  FileText,
  Eye,
  ArrowRight,
  User
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    this_week: 0,
    this_month: 0,
    categories: [],
    recent_repairs: [],
    technician_stats: [],
    priority_stats: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    },
    last7Days: [],
    last4Weeks: [],
    last6Months: []
  });

  // Detect mobile device and screen size
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Navigation functions
  const handleNavigateToNewRepair = () => {
    navigate('/repairs/new');
  };

  const handleNavigateToRepairs = () => {
    navigate('/repairs');
  };

  const handleNavigateToRepairDetail = (repairId) => {
    navigate(`/repairs/${repairId}`);
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const handleNavigateToUsers = () => {
    if (user?.role === 'admin') {
      navigate('/admin/users');
    } else {
      toast.error('ไม่มีสิทธิ์เข้าถึงหน้านี้');
    }
  };

  // Touch-friendly button component
  const TouchButton = ({ onClick, children, className = "", disabled = false, variant = "primary" }) => {
    const baseClasses = "relative overflow-hidden transition-all duration-200 active:scale-95 select-none";
    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl",
      secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border border-gray-300",
      success: "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-lg hover:shadow-xl",
      outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100"
    };
    
    const touchSizeClasses = isMobile ? "min-h-[48px] min-w-[48px] px-4 py-3" : "px-4 py-2";
    
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
          ${isMobile ? 'text-base font-medium' : 'text-sm'}
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

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // เรียก API หลายตัวพร้อมกัน - ดึงข้อมูลทั้งหมดสำหรับทุก role
      const requests = [
        // 1. ข้อมูลการแจ้งซ่อมทั้งหมด (ไม่กรองตาม role)
        axios.get('/api/repairs', { headers }),
        // 2. ข้อมูลหมวดหมู่
        axios.get('/api/repairs/categories', { headers })
      ];

      const [repairsResponse, categoriesResponse] = await Promise.all(requests);

      // 3. ข้อมูลผู้ใช้ (สำหรับสถิติช่าง) - ลองดึงแยก และ handle error
      let usersResponse = { data: [] };
      try {
        // ลองเรียก endpoint ใหม่ก่อน (ถ้ามี)
        try {
          usersResponse = await axios.get('/api/repairs/technicians', { headers });
          console.log('✅ Successfully fetched technicians data');
        } catch (techError) {
          // ถ้า endpoint ใหม่ไม่มี ให้ลองเรียก endpoint เดิม
          usersResponse = await axios.get('/api/admin/users', { headers });
          console.log('✅ Successfully fetched users data');
        }
      } catch (userError) {
        console.log('⚠️ Cannot fetch users data (403 expected for user role):', userError.response?.status);
        // ไม่ error ถ้าดึงข้อมูล users ไม่ได้
      }

      const repairs = repairsResponse.data.repairs || [];
      const categories = categoriesResponse.data || [];
      const users = usersResponse.data || [];

      // คำนวณสถิติจากข้อมูลจริง
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // นับตามสถานะ
      const statusCounts = {
        total: repairs.length,
        pending: repairs.filter(r => r.status === 'pending').length,
        assigned: repairs.filter(r => r.status === 'assigned').length,
        in_progress: repairs.filter(r => r.status === 'in_progress').length,
        completed: repairs.filter(r => r.status === 'completed').length,
        cancelled: repairs.filter(r => r.status === 'cancelled').length
      };

      // นับตามช่วงเวลา
      const todayCount = repairs.filter(r => {
        const createdDate = new Date(r.created_at);
        return createdDate >= today;
      }).length;

      const weekCount = repairs.filter(r => {
        const createdDate = new Date(r.created_at);
        return createdDate >= weekAgo;
      }).length;

      const monthCount = repairs.filter(r => {
        const createdDate = new Date(r.created_at);
        return createdDate >= monthAgo;
      }).length;

      // นับตามหมวดหมู่
      const categoryStats = categories.map(category => {
        const count = repairs.filter(r => r.category_id === category.id).length;
        const percentage = repairs.length > 0 ? Math.round((count / repairs.length) * 100) : 0;
        return {
          id: category.id,
          name: category.name,
          count,
          percentage
        };
      }).sort((a, b) => b.count - a.count); // เรียงตามจำนวนมากไปน้อย

      // นับตามระดับความสำคัญ
      const priorityStats = {
        low: repairs.filter(r => r.priority === 'low').length,
        medium: repairs.filter(r => r.priority === 'medium').length,
        high: repairs.filter(r => r.priority === 'high').length,
        urgent: repairs.filter(r => r.priority === 'urgent').length
      };

      // สถิติช่างเทคนิค - แสดงได้สำหรับทุก role
      const technicians = users.filter(u => u.role === 'technician' || u.role === 'admin');
      const technicianStats = technicians.map(tech => {
        const assignedRepairs = repairs.filter(r => r.assigned_to === tech.id);
        const completed = assignedRepairs.filter(r => r.status === 'completed').length;
        const inProgress = assignedRepairs.filter(r => 
          r.status === 'in_progress' || r.status === 'assigned'
        ).length;
        
        return {
          id: tech.id,
          name: tech.full_name || tech.username,
          completed,
          in_progress: inProgress,
          total: assignedRepairs.length
        };
      }).filter(tech => tech.total > 0) // แสดงเฉพาะช่างที่มีงาน
        .sort((a, b) => b.completed - a.completed); // เรียงตามงานที่เสร็จ

      // การแจ้งซ่อม 5 รายการล่าสุด (สำหรับมือถือ) หรือ 10 รายการ (สำหรับ desktop)
      const recentRepairs = repairs
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, isMobile ? 3 : 5);

      // คำนวณข้อมูลสำหรับกราฟ 7 วันที่ผ่านมา
      const last7DaysData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = repairs.filter(r => {
          const repairDate = new Date(r.created_at).toISOString().split('T')[0];
          return repairDate === dateStr;
        }).length;
        
        last7DaysData.push({
          date: date.toISOString(),
          count: count
        });
      }

      // คำนวณข้อมูลสำหรับกราฟ 4 สัปดาห์ที่ผ่านมา
      const last4WeeksData = [];
      for (let i = 3; i >= 0; i--) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (i + 1) * 7);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - i * 7);
        
        const count = repairs.filter(r => {
          const repairDate = new Date(r.created_at);
          return repairDate >= startDate && repairDate < endDate;
        }).length;
        
        last4WeeksData.push({
          week: `สัปดาห์ ${4 - i}`,
          count: count
        });
      }

      // คำนวณข้อมูลสำหรับกราฟ 6 เดือนที่ผ่านมา
      const last6MonthsData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const count = repairs.filter(r => {
          const repairDate = new Date(r.created_at);
          return repairDate.getFullYear() === year && repairDate.getMonth() === month;
        }).length;
        
        last6MonthsData.push({
          month: date.toLocaleDateString('th-TH', { month: 'short' }),
          count: count
        });
      }

      setStatistics({
        ...statusCounts,
        today: todayCount,
        this_week: weekCount,
        this_month: monthCount,
        categories: categoryStats,
        recent_repairs: recentRepairs,
        technician_stats: technicianStats,
        priority_stats: priorityStats,
        last7Days: last7DaysData,
        last4Weeks: last4WeeksData,
        last6Months: last6MonthsData
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // แสดง error message ที่เฉพาะเจาะจง
      if (error.response?.status === 401) {
        toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
      } else if (error.response?.status === 403) {
        toast.error('ไม่มีสิทธิ์เข้าถึงข้อมูล');
      } else if (error.response?.status >= 500) {
        toast.error('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ภายหลัง');
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
  };

  const getStatusIcon = (status) => {
    const iconSize = isMobile ? "w-4 h-4" : "w-5 h-5";
    switch (status) {
      case 'pending':
        return <Clock className={`${iconSize} text-orange-500`} />;
      case 'assigned':
        return <Users className={`${iconSize} text-purple-500`} />;
      case 'in_progress':
        return <AlertCircle className={`${iconSize} text-blue-500`} />;
      case 'completed':
        return <CheckCircle className={`${iconSize} text-green-500`} />;
      case 'cancelled':
        return <XCircle className={`${iconSize} text-red-500`} />;
      default:
        return <Clock className={`${iconSize} text-gray-500`} />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'รอดำเนินการ',
      'assigned': 'มอบหมายแล้ว',
      'in_progress': 'กำลังดำเนินการ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      'low': 'bg-gray-500',
      'medium': 'bg-yellow-500',
      'high': 'bg-orange-500',
      'urgent': 'bg-red-500'
    };
    return colorMap[priority] || 'bg-gray-500';
  };

  const getPriorityText = (priority) => {
    const priorityMap = {
      'low': 'ต่ำ',
      'medium': 'ปานกลาง',
      'high': 'สูง',
      'urgent': 'เร่งด่วน'
    };
    return priorityMap[priority] || priority;
  };

const headerContent = (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
        รีเฟรช
      </button>
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          ระบบออนไลน์
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date().toLocaleDateString('th-TH')}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout title="แดชบอร์ด">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="แดชบอร์ด" headerContent={headerContent}>
      <div className="space-y-4 sm:space-y-6" style={{ paddingBottom: isMobile ? '80px' : '0' }}>
        {/* Welcome Message - Responsive */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                ยินดีต้อนรับ{isMobile ? '' : ','} {user?.full_name || user?.username}!
              </h2>
              <p className="text-blue-100 mb-2 sm:mb-4 text-sm sm:text-base">
                {isMobile ? 'ภาพรวมระบบ' : 'ภาพรวมระบบจัดการการแจ้งซ่อม - แสดงข้อมูลทั้งหมดในระบบ'}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
                <div className="flex items-center">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  อัพเดท: {new Date().toLocaleTimeString('th-TH', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="flex items-center">
                  <Wrench className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  ทั้งหมด: {statistics.total}
                </div>
              </div>
            </div>
            <div className="hidden md:block ml-4">
              <BarChart3 className="w-16 h-16 lg:w-24 lg:h-24 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Main Statistics Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <TouchButton
            onClick={handleNavigateToRepairs}
            variant="outline"
            className="h-auto p-3 sm:p-4 lg:p-6 flex-col bg-white border-gray-200 hover:border-blue-300 shadow-sm"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate text-left">รายการทั้งหมด</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 text-left">{statistics.total}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg ml-2">
                <Wrench className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" />
              </div>
            </div>
          </TouchButton>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">รอดำเนินการ</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-600">{statistics.pending}</p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-lg ml-2">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">กำลังดำเนินการ</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-600">
                  {statistics.in_progress + statistics.assigned}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg ml-2">
                <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">เสร็จสิ้นแล้ว</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600">{statistics.completed}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg ml-2">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Time Period Statistics with Charts - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Last 7 Days Chart */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">7 วันที่ผ่านมา</h3>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            </div>
            <div className="h-32 sm:h-40 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statistics.last7Days}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
                    }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: isMobile ? '12px' : '14px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('th-TH', { 
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric' 
                      });
                    }}
                    formatter={(value, name) => [value, 'รายการใหม่']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.today}</p>
              <p className="text-xs sm:text-sm text-gray-600">รายการวันนี้</p>
            </div>
          </div>

          {/* Last 4 Weeks Chart */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">4 สัปดาห์ที่ผ่านมา</h3>
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <div className="h-32 sm:h-40 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.last4Weeks}>
                  <XAxis 
                    dataKey="week" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: isMobile ? '12px' : '14px'
                    }}
                    formatter={(value, name) => [value, 'รายการรวม']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.this_week}</p>
              <p className="text-xs sm:text-sm text-gray-600">รายการสัปดาห์นี้</p>
            </div>
          </div>

          {/* Last 6 Months Chart */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">6 เดือนที่ผ่านมา</h3>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            </div>
            <div className="h-32 sm:h-40 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statistics.last6Months}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: isMobile ? '12px' : '14px'
                    }}
                    formatter={(value, name) => [value, 'รายการรวม']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.this_month}</p>
              <p className="text-xs sm:text-sm text-gray-600">รายการเดือนนี้</p>
            </div>
          </div>
        </div>

        {/* Categories and Priority Stats - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Popular Categories */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mr-2 sm:mr-3" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">หมวดหมู่ที่ถูกแจ้งบ่อย</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {statistics.categories.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">ไม่มีข้อมูลหมวดหมู่</p>
              ) : (
                statistics.categories.slice(0, isMobile ? 3 : 5).map((category, index) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                      <span className="text-sm sm:text-base text-gray-900 font-medium truncate">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 ml-2">
                      <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 w-6 sm:w-8 text-right">{category.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Priority Statistics */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 mr-2 sm:mr-3" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">สถิติตามความสำคัญ</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(statistics.priority_stats).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mr-2 sm:mr-3 flex-shrink-0 ${getPriorityColor(priority)}`}></div>
                    <span className="text-sm sm:text-base text-gray-900 font-medium">{getPriorityText(priority)}</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 ml-2">
                    <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                        style={{ 
                          width: `${statistics.total > 0 ? (count / statistics.total) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600 w-6 sm:w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technician Performance - Responsive Grid */}
        {statistics.technician_stats.length > 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-2 sm:mr-3" />
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">ประสิทธิภาพช่างเทคนิค</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {statistics.technician_stats.slice(0, isMobile ? 4 : 6).map((tech) => (
                <div key={tech.id} className="border border-gray-100 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm sm:text-base font-medium text-gray-900 truncate">{tech.name}</span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">รวม {tech.total}</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm mb-3">
                    <div className="flex items-center">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                      <span>เสร็จ: {tech.completed}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 mr-1" />
                      <span>กำลังทำ: {tech.in_progress}</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${tech.total > 0 ? (tech.completed / tech.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Repairs - Mobile Optimized */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">การแจ้งซ่อมล่าสุด</h3>
          <div className="space-y-3 sm:space-y-4">
            {statistics.recent_repairs.length === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">ไม่มีข้อมูลการแจ้งซ่อม</p>
            ) : (
              statistics.recent_repairs.map((repair) => (
                <TouchButton
                  key={repair.id}
                  onClick={() => handleNavigateToRepairDetail(repair.id)}
                  variant="outline"
                  className="w-full p-3 sm:p-4 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-start sm:items-center justify-between w-full">
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      {getStatusIcon(repair.status)}
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">{repair.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{repair.location}</p>
                        {repair.category_name && (
                          <p className="text-xs text-gray-500 truncate mt-1">หมวดหมู่: {repair.category_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-xs sm:text-sm text-gray-900 font-medium">
                        {getStatusText(repair.status)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(repair.created_at).toLocaleDateString('th-TH', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </p>
                      {!isMobile && (
                        <p className="text-xs text-gray-400">
                          {repair.requester_name || 'ไม่ระบุ'}
                        </p>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-400 mt-1 inline-block" />
                    </div>
                  </div>
                </TouchButton>
              ))
            )}
          </div>
          
          {/* Show more button for mobile */}
          {isMobile && statistics.recent_repairs.length > 0 && (
            <div className="mt-4 text-center">
              <TouchButton
                onClick={handleNavigateToRepairs}
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
              </TouchButton>
            </div>
          )}
        </div>

        {/* Mobile Quick Actions */}
        {isMobile && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">การดำเนินการด่วน</h3>
            <div className="grid grid-cols-2 gap-3">
              <TouchButton
                onClick={handleNavigateToNewRepair}
                variant="primary"
                className="flex-col p-4 h-20"
              >
                <Wrench className="w-6 h-6 text-white mb-2" />
                <span className="text-xs font-medium text-white">แจ้งซ่อมใหม่</span>
              </TouchButton>
              
              <TouchButton
                onClick={handleNavigateToRepairs}
                variant="success"
                className="flex-col p-4 h-20"
              >
                <BarChart3 className="w-6 h-6 text-white mb-2" />
                <span className="text-xs font-medium text-white">ดูรายการ</span>
              </TouchButton>
              
              <TouchButton
                onClick={handleNavigateToProfile}
                variant="secondary"
                className="flex-col p-4 h-20"
              >
                <User className="w-6 h-6 text-gray-600 mb-2" />
                <span className="text-xs font-medium text-gray-700">โปรไฟล์</span>
              </TouchButton>
              
              {user?.role === 'admin' && (
                <TouchButton
                  onClick={handleNavigateToUsers}
                  variant="secondary"
                  className="flex-col p-4 h-20"
                >
                  <Users className="w-6 h-6 text-gray-600 mb-2" />
                  <span className="text-xs font-medium text-gray-700">จัดการผู้ใช้</span>
                </TouchButton>
              )}
            </div>
          </div>
        )}

        {/* Additional Mobile Statistics Cards */}
        {isMobile && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Tag className="w-5 h-5 text-purple-200" />
                <span className="text-xs font-medium bg-white bg-opacity-20 px-2 py-1 rounded">หมวดหมู่</span>
              </div>
              <p className="text-lg font-bold">{statistics.categories.length}</p>
              <p className="text-xs text-purple-100">หมวดหมู่ทั้งหมด</p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-indigo-200" />
                <span className="text-xs font-medium bg-white bg-opacity-20 px-2 py-1 rounded">อัตรา</span>
              </div>
              <p className="text-lg font-bold">
                {statistics.total > 0 ? Math.round((statistics.completed / statistics.total) * 100) : 0}%
              </p>
              <p className="text-xs text-indigo-100">อัตราความสำเร็จ</p>
            </div>
          </div>
        )}

        {/* Performance Insights - Mobile Only */}
        {isMobile && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center mb-3">
              <TrendingUp className="w-5 h-5 text-green-200 mr-2" />
              <h3 className="text-sm font-semibold">ประสิทธิภาพวันนี้</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xl font-bold">{statistics.today}</p>
                <p className="text-xs text-green-100">แจ้งใหม่</p>
              </div>
              <div>
                <p className="text-xl font-bold">
                  {statistics.recent_repairs.filter(r => 
                    r.status === 'completed' && 
                    new Date(r.updated_at || r.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
                <p className="text-xs text-green-100">เสร็จวันนี้</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;