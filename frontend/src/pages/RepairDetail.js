import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Image as ImageIcon,
  FileText,
  RefreshCw,
  Eye,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Share2,
  MoreVertical,
  UserCheck // เพิ่ม icon สำหรับสถานะ assigned
} from 'lucide-react';

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Detect mobile device
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
    fetchRepairDetail();
  }, [id]);

  // Touch-friendly button component
  const TouchButton = ({ onClick, children, className = "", disabled = false, variant = "primary", size = "md" }) => {
    const baseClasses = "relative overflow-hidden transition-all duration-200 active:scale-95 select-none";
    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md hover:shadow-lg",
      secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border border-gray-300",
      success: "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-md hover:shadow-lg",
      danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md hover:shadow-lg",
      ghost: "hover:bg-gray-100 active:bg-gray-200 text-gray-700"
    };
    
    const sizeClasses = {
      sm: isMobile ? "min-h-[44px] px-3 py-2 text-sm" : "px-3 py-2 text-sm",
      md: isMobile ? "min-h-[48px] px-4 py-3 text-base" : "px-4 py-2 text-sm",
      lg: isMobile ? "min-h-[52px] px-6 py-4 text-lg" : "px-6 py-3 text-base"
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          rounded-lg flex items-center justify-center font-medium
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

  const fetchRepairDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      const response = await axios.get(`/api/repairs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Repair detail response:', response.data);
      setRepair(response.data);
    } catch (error) {
      console.error('Error fetching repair detail:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
        navigate('/repairs');
      } else if (error.response?.status === 404) {
        toast.error('ไม่พบรายการแจ้งซ่อมที่ต้องการ');
        navigate('/repairs');
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        navigate('/repairs');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRepairDetail();
  };

  // รวม images จากทั้งระบบเก่าและใหม่
  const getAllImages = () => {
    const images = [];
    
    // รูปภาพจากระบบใหม่ (หลายรูป)
    if (repair?.images && Array.isArray(repair.images) && repair.images.length > 0) {
      repair.images.forEach(img => {
        images.push({
          id: img.id,
          url: `http://localhost:5000/${img.file_path}`,
          name: img.file_name || 'รูปภาพ',
          file_path: img.file_path,
          type: 'new'
        });
      });
    }
    
    // รูปภาพจากระบบเก่า (รูปเดียว) - fallback
    if (repair?.image_path && images.length === 0) {
      images.push({
        id: 'legacy',
        url: `http://localhost:5000/${repair.image_path}`,
        name: 'รูปภาพประกอบ',
        file_path: repair.image_path,
        type: 'legacy'
      });
    }
    
    console.log('All images:', images); // Debug log
    return images;
  };

  const downloadImage = (imageUrl, imageName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName || `repair_${repair.id}_image`;
    link.target = '_blank';
    link.click();
  };

  const downloadAllImages = () => {
    const images = getAllImages();
    images.forEach((img, index) => {
      setTimeout(() => {
        downloadImage(img.url, `repair_${repair.id}_image_${index + 1}`);
      }, index * 500); // หน่วงเวลาเพื่อไม่ให้ browser block
    });
  };

  const shareRepair = async () => {
    const shareData = {
      title: `การแจ้งซ่อม #${repair.id}`,
      text: `${repair.title}\nสถานที่: ${repair.location}\nสถานะ: ${getStatusText(repair.status)}`,
      url: window.location.href
    };

    if (navigator.share && isMobile) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('คัดลอกลิงก์แล้ว');
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('คัดลอกลิงก์แล้ว');
    }
  };

  const openImageModal = (index) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
    // Prevent body scroll on mobile
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    // Restore body scroll
    if (isMobile) {
      document.body.style.overflow = 'unset';
    }
  };

  const nextImage = () => {
    const images = getAllImages();
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getAllImages();
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // ✅ Fixed: เพิ่มการรองรับสถานะ assigned ที่ขาดหายไป + รองรับ empty string
  const getStatusIcon = (status) => {
    const iconSize = isMobile ? "w-5 h-5" : "w-6 h-6";
    
    // ✅ จัดการกรณี status เป็นค่าว่างหรือ null/undefined
    if (!status || status === '') {
      return <AlertCircle className={`${iconSize} text-gray-500`} />;
    }
    
    switch (status) {
      case 'pending':
        return <Clock className={`${iconSize} text-orange-500`} />;
      case 'assigned':
        return <UserCheck className={`${iconSize} text-purple-500`} />; // ✅ เพิ่มไอคอนสำหรับ assigned
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

  // ✅ Fixed: เพิ่มการรองรับสถานะ assigned ที่ขาดหายไป + รองรับ empty string
  const getStatusText = (status) => {
    // ✅ จัดการกรณี status เป็นค่าว่างหรือ null/undefined
    if (!status || status === '') {
      return 'ไม่ระบุสถานะ';
    }
    
    const statusMap = {
      'pending': 'รอดำเนินการ',
      'assigned': 'มอบหมายแล้ว', // ✅ เพิ่มสถานะที่ขาดหายไป
      'in_progress': 'กำลังดำเนินการ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  };

  // ✅ Fixed: เพิ่มการรองรับสถานะ assigned ที่ขาดหายไป + รองรับ empty string
  const getStatusBadge = (status) => {
    // ✅ จัดการกรณี status เป็นค่าว่างหรือ null/undefined
    if (!status || status === '') {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    const badgeMap = {
      'pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'assigned': 'bg-purple-100 text-purple-800 border-purple-200', // ✅ เพิ่มสีสำหรับ assigned
      'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return badgeMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getPriorityBadge = (priority) => {
    const badgeMap = {
      'low': 'bg-gray-100 text-gray-800 border-gray-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'urgent': 'bg-red-100 text-red-800 border-red-200'
    };
    return badgeMap[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const canEdit = () => {
    if (!repair || !user) return false;
    
    // Admin และ Technician แก้ไขได้ทุกรายการ
    if (user.role === 'admin' || user.role === 'technician') {
      return true;
    }
    // User แก้ไขได้เฉพาะรายการของตัวเองที่ยังไม่เสร็จสิ้น
    if (user.role === 'user' && repair.requester_id === user.id) {
      return repair.status === 'pending';
    }
    return false;
  };

  const formatThaiDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: isMobile ? 'short' : 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const headerContent = isMobile ? (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => navigate('/repairs')}
        className="p-3 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          minHeight: '48px',
          minWidth: '48px'
        }}
      >
        <ArrowLeft className="w-5 h-5 text-blue-600" />
      </button>
      
      <div className="relative">
        <TouchButton
          onClick={() => setShowActions(!showActions)}
          variant="ghost"
          size="sm"
        >
          <MoreVertical className="w-5 h-5" />
        </TouchButton>
        
        {showActions && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[160px]">
            <button
              onClick={() => {
                handleRefresh();
                setShowActions(false);
              }}
              disabled={refreshing}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            
            <button
              onClick={() => {
                shareRepair();
                setShowActions(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
            >
              <Share2 className="w-4 h-4 mr-2" />
              แชร์
            </button>
            
            {canEdit() && (
              <button
                onClick={() => {
                  navigate(`/repairs/${repair?.id}/edit`);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-green-600"
              >
                <Edit className="w-4 h-4 mr-2" />
                แก้ไข
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex items-center space-x-3">
      <TouchButton
        onClick={() => navigate('/repairs')}
        variant="secondary"
        size="sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        กลับรายการ
      </TouchButton>
      
      <TouchButton
        onClick={handleRefresh}
        disabled={refreshing}
        variant="secondary"
        size="sm"
      >
        <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
        รีเฟรช
      </TouchButton>

      {canEdit() && (
        <TouchButton
          onClick={() => navigate(`/repairs/${repair?.id}/edit`)}
          variant="success"
          size="sm"
        >
          <Edit className="w-4 h-4 mr-2" />
          แก้ไข
        </TouchButton>
      )}
    </div>
  );

  if (loading) {
    return (
      <Layout title="รายละเอียดการแจ้งซ่อม">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!repair) {
    return (
      <Layout title="ไม่พบข้อมูล">
        <div className="flex items-center justify-center h-64">
          <div className="text-center px-4">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูล</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">ไม่พบรายการแจ้งซ่อมที่ต้องการ</p>
            <TouchButton
              onClick={() => navigate('/repairs')}
              variant="primary"
              size="md"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับสู่รายการแจ้งซ่อม
            </TouchButton>
          </div>
        </div>
      </Layout>
    );
  }

  const images = getAllImages();

  return (
    <Layout title={isMobile ? `#${repair.id}` : `การแจ้งซ่อม #${repair.id}`} headerContent={headerContent}>
      <div className={`mx-auto space-y-4 sm:space-y-6 ${isMobile ? 'px-0' : 'max-w-4xl'}`} style={{ paddingBottom: isMobile ? '80px' : '0' }}>
        {/* Main Info Card */}
        <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'}`}>
          <div className={`${isMobile ? 'space-y-4' : 'flex items-start justify-between'} ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <div className={`flex items-start space-x-3 ${isMobile ? '' : 'space-x-4'}`}>
              {getStatusIcon(repair.status)}
              <div className="flex-1 min-w-0">
                <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 mb-2 leading-tight`}>
                  {repair.title}
                </h1>
                <div className={`flex flex-wrap items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <span className={`px-2 py-1 font-medium rounded-full border ${getStatusBadge(repair.status)}`}>
                    {getStatusText(repair.status)}
                  </span>
                  <span className={`px-2 py-1 font-medium rounded-full border ${getPriorityBadge(repair.priority)}`}>
                    {isMobile ? getPriorityText(repair.priority) : `ระดับ: ${getPriorityText(repair.priority)}`}
                  </span>
                  {images.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 font-medium rounded-full bg-blue-100 text-blue-600">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {images.length} รูป
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {!isMobile && (
              <div className="text-right text-sm text-gray-500 flex-shrink-0 ml-4">
                <p className="font-medium">รหัส: REP-{repair.id.toString().padStart(5, '0')}</p>
                <p>สร้างเมื่อ: {formatThaiDate(repair.created_at)}</p>
                {repair.updated_at !== repair.created_at && (
                  <p>อัพเดท: {formatThaiDate(repair.updated_at)}</p>
                )}
              </div>
            )}
          </div>

          {/* Mobile ID Card */}
          {isMobile && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">รหัส: REP-{repair.id.toString().padStart(5, '0')}</p>
              <p className="text-xs text-gray-500">สร้าง: {formatThaiDate(repair.created_at)}</p>
              {repair.updated_at !== repair.created_at && (
                <p className="text-xs text-gray-500">อัพเดท: {formatThaiDate(repair.updated_at)}</p>
              )}
            </div>
          )}

          <div className={`grid grid-cols-1 ${isMobile ? 'gap-4 mb-4' : 'md:grid-cols-2 gap-6 mb-6'}`}>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start">
                <User className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-3 mt-1 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>ผู้แจ้ง</p>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate`}>
                    {repair.requester_name || 'ไม่ระบุ'}
                  </p>
                  {repair.requester_email && !isMobile && (
                    <p className="text-sm text-gray-500 truncate">{repair.requester_email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-3 mt-1 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>สถานที่</p>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                    {repair.location}
                  </p>
                </div>
              </div>

              {repair.category_name && (
                <div className="flex items-start">
                  <Tag className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-3 mt-1 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>หมวดหมู่</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                      {repair.category_name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {repair.assigned_name ? (
                <div className="flex items-start">
                  <UserCheck className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-purple-400 mr-3 mt-1 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>ผู้รับผิดชอบ</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate`}>
                      {repair.assigned_name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <User className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-3 mt-1 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>ผู้รับผิดชอบ</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-500 italic`}>ยังไม่มอบหมาย</p>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <Calendar className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-3 mt-1 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>วันที่สร้าง</p>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                    {formatThaiDate(repair.created_at)}
                  </p>
                </div>
              </div>

              {repair.completed_at && (
                <div className="flex items-start">
                  <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-500 mr-3 mt-1 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>วันที่เสร็จสิ้น</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                      {formatThaiDate(repair.completed_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className={`border-t ${isMobile ? 'pt-4' : 'pt-6'}`}>
            <div className="flex items-center mb-3">
              <FileText className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-2`} />
              <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>รายละเอียดปัญหา</h3>
            </div>
            <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-700 leading-relaxed whitespace-pre-wrap`}>
                {repair.description}
              </p>
            </div>
          </div>

          {/* Completion Details */}
          {repair.completion_details && (
            <div className={`border-t ${isMobile ? 'pt-4 mt-4' : 'pt-6 mt-6'}`}>
              <div className="flex items-center mb-3">
                <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-500 mr-2`} />
                <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>รายละเอียดการซ่อม</h3>
              </div>
              <div className={`bg-green-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-700 leading-relaxed whitespace-pre-wrap`}>
                  {repair.completion_details}
                </p>
              </div>
            </div>
          )}

          {/* Multiple Images Section */}
          {images.length > 0 && (
            <div className={`border-t ${isMobile ? 'pt-4 mt-4' : 'pt-6 mt-6'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <ImageIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-2`} />
                  <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>
                    รูปภาพประกอบ ({images.length} รูป)
                  </h3>
                </div>
                {!isMobile && (
                  <div className="flex space-x-2">
                    <TouchButton
                      onClick={downloadAllImages}
                      variant="secondary"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      ดาวน์โหลดทั้งหมด
                    </TouchButton>
                  </div>
                )}
              </div>

              {/* Image Grid - Mobile Optimized */}
              <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
                {images.map((image, index) => (
                  <div key={image.id} className="relative group cursor-pointer">
                    <div
                      className={`aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors`}
                      onClick={() => openImageModal(index)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          console.error('Image load error:', image.url);
                          e.target.src = '/placeholder-image.png';
                        }}
                      />
                      <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors flex items-center justify-center`}>
                        <Eye className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </div>
                    
                    {/* Image name overlay */}
                    <div className={`absolute bottom-1 left-1 right-1`}>
                      <div className={`bg-black bg-opacity-70 text-white ${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} rounded truncate`}>
                        {isMobile ? `${index + 1}` : image.name}
                      </div>
                    </div>
                    
                    {/* Download button - Desktop only */}
                    {!isMobile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image.url, image.name);
                        }}
                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile Download All Button */}
              {isMobile && (
                <div className="mt-4 text-center">
                  <TouchButton
                    onClick={downloadAllImages}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ดาวน์โหลดรูปทั้งหมด
                  </TouchButton>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status History - Mobile Optimized + Fixed Empty Status + Debug Info */}
        {repair.status_history && repair.status_history.length > 0 && (
          <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'}`}>
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-6'} flex items-center`}>
              <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-2`} />
              ประวัติการอัพเดทสถานะ
            </h3>
            
            <div className={`space-y-${isMobile ? '3' : '4'}`}>
              {repair.status_history
                .filter(history => {
                  // ✅ พิจารณาแสดง history แม้ new_status จะว่าง แต่มี old_status
                  const hasValidNewStatus = history.new_status && history.new_status !== '';
                  const hasValidOldStatus = history.old_status && history.old_status !== '';
                  return hasValidNewStatus || hasValidOldStatus;
                })
                .map((history, index) => (
                <div key={history.id || index} className={`flex items-start space-x-3 ${isMobile ? 'pb-3' : 'pb-4'} border-b border-gray-100 last:border-b-0`}>
                  <div className="flex-shrink-0 mt-1">
                    {/* ✅ ใช้ old_status เมื่อ new_status ว่าง */}
                    {getStatusIcon(history.new_status || history.old_status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`flex flex-wrap items-center gap-2 ${isMobile ? 'mb-2' : 'mb-2'}`}>
                      {/* ✅ แสดงสถานะปัจจุบันหรือสถานะเก่าถ้า new_status ว่าง */}
                      {history.new_status && history.new_status !== '' ? (
                        <span className={`px-2 py-1 ${isMobile ? 'text-xs' : 'text-xs'} font-medium rounded-full border ${getStatusBadge(history.new_status)}`}>
                          {getStatusText(history.new_status)}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full border bg-red-100 text-red-800 border-red-200">
                          ข้อมูลสถานะไม่สมบูรณ์
                        </span>
                      )}
                      
                      {history.old_status && history.old_status !== '' && (
                        <>
                          <span className="text-gray-400 text-xs">←</span>
                          <span className={`px-2 py-1 ${isMobile ? 'text-xs' : 'text-xs'} font-medium rounded-full border ${getStatusBadge(history.old_status)}`}>
                            {getStatusText(history.old_status)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-1`}>
                      <strong>โดย:</strong> {history.updated_by_name || 'ไม่ระบุ'}
                    </div>
                    <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mb-2`}>
                      {formatThaiDate(history.created_at)}
                    </div>
                    
                    {history.notes && (
                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 bg-gray-50 rounded-md ${isMobile ? 'p-2' : 'p-3'}`}>
                        <strong>หมายเหตุ:</strong> {history.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* ✅ แสดงข้อความเมื่อไม่มีประวัติที่แสดงได้ */}
            {repair.status_history.filter(h => (h.new_status && h.new_status !== '') || (h.old_status && h.old_status !== '')).length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">ยังไม่มีประวัติการอัพเดทสถานะ</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - Mobile Optimized */}
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-center space-x-4'} ${isMobile ? 'pt-4' : 'pt-6'}`}>
          {!isMobile && (
            <TouchButton
              onClick={() => navigate('/repairs')}
              variant="secondary"
              size="md"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับสู่รายการ
            </TouchButton>
          )}
          
          {canEdit() && (
            <TouchButton
              onClick={() => navigate(`/repairs/${repair.id}/edit`)}
              variant="success"
              size="md"
              className={isMobile ? 'w-full' : ''}
            >
              <Edit className="w-4 h-4 mr-2" />
              แก้ไขข้อมูล
            </TouchButton>
          )}
          
          <TouchButton
            onClick={handleRefresh}
            disabled={refreshing}
            variant="primary"
            size="md"
            className={isMobile ? 'w-full' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
          </TouchButton>

          {isMobile && (
            <TouchButton
              onClick={shareRepair}
              variant="secondary"
              size="md"
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              แชร์รายการนี้
            </TouchButton>
          )}
        </div>
      </div>

      {/* Mobile-Optimized Image Modal */}
      {isImageModalOpen && images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <TouchButton
              onClick={closeImageModal}
              variant="danger"
              size="sm"
              className={`absolute ${isMobile ? 'top-4 right-4' : 'top-6 right-6'} z-10 rounded-full bg-black bg-opacity-70 hover:bg-opacity-90`}
            >
              <X className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
            </TouchButton>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <TouchButton
                  onClick={prevImage}
                  variant="ghost"
                  size="md"
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 rounded-full bg-black bg-opacity-70 hover:bg-opacity-90 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                >
                  <ChevronLeft className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                </TouchButton>
                <TouchButton
                  onClick={nextImage}
                  variant="ghost"
                  size="md"
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-10 rounded-full bg-black bg-opacity-70 hover:bg-opacity-90 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
                >
                  <ChevronRight className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                </TouchButton>
              </>
            )}

            {/* Image */}
            <img
              src={images[selectedImageIndex]?.url}
              alt={images[selectedImageIndex]?.name}
              className="max-w-full max-h-full object-contain"
              style={{ 
                maxHeight: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 160px)',
                maxWidth: isMobile ? 'calc(100vw - 32px)' : 'calc(100vw - 64px)'
              }}
            />

            {/* Image Info */}
            <div className={`absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
                <div>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium truncate`}>
                    {images[selectedImageIndex]?.name}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-300`}>
                    รูปที่ {selectedImageIndex + 1} จาก {images.length}
                  </p>
                </div>
                <TouchButton
                  onClick={() => downloadImage(images[selectedImageIndex]?.url, images[selectedImageIndex]?.name)}
                  variant="primary"
                  size="sm"
                  className={isMobile ? 'w-full' : ''}
                >
                  <Download className="w-4 h-4 mr-2" />
                  ดาวน์โหลด
                </TouchButton>
              </div>
            </div>

            {/* Swipe indicators for mobile */}
            {isMobile && images.length > 1 && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedImageIndex ? 'bg-white' : 'bg-white bg-opacity-40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Touch gestures for mobile image modal */}
      {isMobile && isImageModalOpen && (
        <div
          className="fixed inset-0 z-40 touch-pan-x"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            e.currentTarget.startX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - e.currentTarget.startX;
            const threshold = 50;
            
            if (Math.abs(deltaX) > threshold) {
              if (deltaX > 0) {
                prevImage();
              } else {
                nextImage();
              }
            }
          }}
        />
      )}
    </Layout>
  );
};

export default RepairDetail;