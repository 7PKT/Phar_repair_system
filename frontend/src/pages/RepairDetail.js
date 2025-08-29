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
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Share2,
  MoreVertical,
  UserCheck
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
  
  // ✅ เพิ่ม state สำหรับจัดการรูปภาพแยกประเภท
  const [selectedImageType, setSelectedImageType] = useState('regular'); // 'regular' หรือ 'completion'
  
  const [isMobile, setIsMobile] = useState(false);
  const [showActions, setShowActions] = useState(false);

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

  // ✅ ฟังก์ชันสร้าง placeholder image แบบปลอดภัย
  const createPlaceholderImage = () => {
    const svgContent = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <g>
          <rect x="35" y="25" width="30" height="20" fill="#d1d5db" rx="2"/>
          <circle cx="42" cy="32" r="3" fill="#9ca3af"/>
          <polygon points="60,40 50,30 55,25 65,35 75,25 85,35 85,45 35,45" fill="#d1d5db"/>
        </g>
        <text x="50" y="65" font-family="Arial, sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">No Image</text>
      </svg>
    `;
    
    try {
      // ใช้ encodeURIComponent แทน btoa สำหรับข้อความที่มีภาษาไทย
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    } catch (error) {
      console.warn('Error creating placeholder:', error);
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+';
    }
  };

  // ✅ ฟังก์ชันจัดการ URL รูปภาพอย่างปลอดภัย
  const getImageUrl = (filePath) => {
    if (!filePath) return createPlaceholderImage();
    
    // ถ้า filePath เป็น full URL แล้ว ให้ return ตรงๆ
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // ถ้าเป็น relative path ให้เพิ่ม base URL
    const baseUrl = 'http://localhost:5000';
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    
    return `${baseUrl}${cleanPath}`;
  };

  // ✅ ฟังก์ชันแยกรูปภาพทั่วไป
  const getRegularImages = () => {
    const images = [];

    if (repair?.images && Array.isArray(repair.images) && repair.images.length > 0) {
      repair.images.forEach(img => {
        images.push({
          id: img.id,
          url: getImageUrl(img.file_path), // ✅ ใช้ฟังก์ชันใหม่
          name: img.file_name || 'รูปภาพ',
          file_path: img.file_path,
          type: 'new'
        });
      });
    }

    if (repair?.image_path && images.length === 0) {
      images.push({
        id: 'legacy',
        url: getImageUrl(repair.image_path), // ✅ ใช้ฟังก์ชันใหม่
        name: 'รูปภาพประกอบ',
        file_path: repair.image_path,
        type: 'legacy'
      });
    }

    return images;
  };

  // ✅ ฟังก์ชันแยกรูปภาพเสร็จสิ้น
  const getCompletionImages = () => {
    const images = [];

    if (repair?.completion_images && Array.isArray(repair.completion_images) && repair.completion_images.length > 0) {
      repair.completion_images.forEach(img => {
        images.push({
          id: img.id,
          url: getImageUrl(img.file_path), // ✅ ใช้ฟังก์ชันใหม่
          name: img.file_name || 'รูปงานเสร็จสิ้น',
          file_path: img.file_path,
          type: 'completion'
        });
      });
    }

    return images;
  };

  // ✅ ฟังก์ชันรวมรูปภาพทั้งหมด (ใช้สำหรับ modal)
  const getAllImages = () => {
    return [...getRegularImages(), ...getCompletionImages()];
  };

  const downloadImage = (imageUrl, imageName) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageName || `repair_${repair.id}_image`;
      link.target = '_blank';
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('ไม่สามารถดาวน์โหลดรูปภาพได้');
    }
  };

  const downloadAllImages = () => {
    const images = getAllImages();
    if (images.length === 0) {
      toast.error('ไม่มีรูปภาพให้ดาวน์โหลด');
      return;
    }
    
    images.forEach((img, index) => {
      setTimeout(() => {
        downloadImage(img.url, `repair_${repair.id}_image_${index + 1}`);
      }, index * 500);
    });
    
    toast.success(`เริ่มดาวน์โหลด ${images.length} รูป`);
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
        navigator.clipboard.writeText(window.location.href);
        toast.success('คัดลอกลิงก์แล้ว');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('คัดลอกลิงก์แล้ว');
    }
  };

  // ✅ ปรับปรุงฟังก์ชันเปิด modal รูปภาพ
  const openImageModal = (index, imageType = 'regular') => {
    setSelectedImageIndex(index);
    setSelectedImageType(imageType);
    setIsImageModalOpen(true);
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    if (isMobile) {
      document.body.style.overflow = 'unset';
    }
  };

  const nextImage = () => {
    const images = selectedImageType === 'completion' ? getCompletionImages() : getRegularImages();
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = selectedImageType === 'completion' ? getCompletionImages() : getRegularImages();
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getStatusIcon = (status) => {
    const iconSize = isMobile ? "w-5 h-5" : "w-6 h-6";

    if (!status || status === '') {
      return <AlertCircle className={`${iconSize} text-gray-500`} />;
    }

    switch (status) {
      case 'pending':
        return <Clock className={`${iconSize} text-orange-500`} />;
      case 'assigned':
        return <UserCheck className={`${iconSize} text-purple-500`} />;
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
    if (!status || status === '') {
      return 'ไม่ระบุสถานะ';
    }

    const statusMap = {
      'pending': 'รอดำเนินการ',
      'assigned': 'มอบหมายแล้ว',
      'in_progress': 'กำลังดำเนินการ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status) => {
    if (!status || status === '') {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }

    const badgeMap = {
      'pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'assigned': 'bg-purple-100 text-purple-800 border-purple-200',
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

    if (user.role === 'admin' || user.role === 'technician') {
      return true;
    }
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

  // ✅ Image Error Handler ที่ปลอดภัย
  const handleImageError = (e, type = 'regular') => {
    console.warn(`${type} image load error:`, e.target.src);
    e.target.src = createPlaceholderImage();
    
    // ป้องกันการ loop error
    e.target.onerror = null;
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
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-blue-700 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              รีเฟรช
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

            {getAllImages().length > 0 && (
              <button
                onClick={() => {
                  downloadAllImages();
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-purple-600"
              >
                <Download className="w-4 h-4 mr-2" />
                ดาวน์โหลดรูป
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

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
      >
        <RefreshCw
          className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`}
        />
        รีเฟรช
      </button>

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

      {getAllImages().length > 0 && (
        <TouchButton
          onClick={downloadAllImages}
          variant="secondary"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          ดาวน์โหลดรูป
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

  const regularImages = getRegularImages();
  const completionImages = getCompletionImages();
  const allImages = getAllImages();

  return (
    <Layout title={isMobile ? `#${repair.id}` : `การแจ้งซ่อม #${repair.id}`} headerContent={headerContent}>
      <div className={`mx-auto space-y-4 sm:space-y-6 ${isMobile ? 'px-0' : 'max-w-4xl'}`} style={{ paddingBottom: isMobile ? '80px' : '0' }}>
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
                  {regularImages.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 font-medium rounded-full bg-blue-100 text-blue-600">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {regularImages.length} รูป
                    </span>
                  )}
                  {/* ✅ แสดง badge รูปภาพเสร็จสิ้น */}
                  {completionImages.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 font-medium rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {completionImages.length} งานเสร็จ
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

          {/* ✅ ส่วนรูปภาพทั่วไป */}
          {regularImages.length > 0 && (
            <div className={`border-t ${isMobile ? 'pt-4 mt-4' : 'pt-6 mt-6'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <ImageIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-2`} />
                  <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>
                    รูปภาพประกอบ ({regularImages.length} รูป)
                  </h3>
                </div>
              </div>

              <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
                {regularImages.map((image, index) => (
                  <div key={image.id} className="relative group cursor-pointer">
                    <div
                      className={`aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors`}
                      onClick={() => openImageModal(index, 'regular')}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => handleImageError(e, 'regular')}
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors flex items-center justify-center`}>
                        <Eye className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </div>

                    <div className={`absolute bottom-1 left-1 right-1`}>
                      <div className={`bg-black bg-opacity-70 text-white ${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} rounded truncate`}>
                        {isMobile ? `${index + 1}` : image.name}
                      </div>
                    </div>

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
            </div>
          )}

          {/* ✅ ส่วนรูปภาพงานเสร็จสิ้น */}
          {completionImages.length > 0 && (
            <div className={`border-t ${isMobile ? 'pt-4 mt-4' : 'pt-6 mt-6'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-500 mr-2`} />
                  <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>
                    รูปภาพงานเสร็จสิ้น ({completionImages.length} รูป)
                  </h3>
                </div>
              </div>

              <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
                {completionImages.map((image, index) => (
                  <div key={image.id} className="relative group cursor-pointer">
                    <div
                      className={`aspect-square rounded-lg overflow-hidden border border-green-200 hover:border-green-300 transition-colors bg-green-50`}
                      onClick={() => openImageModal(index, 'completion')}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => handleImageError(e, 'completion')}
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors flex items-center justify-center`}>
                        <Eye className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </div>

                    <div className={`absolute bottom-1 left-1 right-1`}>
                      <div className={`bg-green-600 bg-opacity-90 text-white ${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} rounded truncate`}>
                        {isMobile ? `เสร็จ ${index + 1}` : image.name}
                      </div>
                    </div>

                    <div className={`absolute top-1 left-1 bg-green-600 text-white px-1 py-0.5 rounded text-xs`}>
                      ✓
                    </div>

                    {!isMobile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image.url, image.name);
                        }}
                        className="absolute top-2 right-2 bg-green-600 bg-opacity-80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-90"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ✅ ประวัติการอัปเดทสถานะ */}
        {repair.status_history && repair.status_history.length > 0 && (
          <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'}`}>
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-6'} flex items-center`}>
              <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 mr-2`} />
              ประวัติการอัพเดทสถานะ
            </h3>

            <div className={`space-y-${isMobile ? '4' : '6'}`}>
              {repair.status_history
                .filter(history => {
                  const hasValidNewStatus = history.new_status && history.new_status !== '';
                  const hasValidOldStatus = history.old_status && history.old_status !== '';
                  return hasValidNewStatus || hasValidOldStatus;
                })
                .map((history, index) => (
                  <div key={history.id || index} className={`flex items-start space-x-3 ${isMobile ? 'pb-4' : 'pb-6'} border-b border-gray-100 last:border-b-0`}>
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(history.new_status || history.old_status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`flex flex-wrap items-center gap-2 ${isMobile ? 'mb-2' : 'mb-2'}`}>
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
                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 bg-gray-50 rounded-md ${isMobile ? 'p-2 mb-2' : 'p-3 mb-3'}`}>
                          <strong>หมายเหตุ:</strong> {history.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {repair.status_history.filter(h => (h.new_status && h.new_status !== '') || (h.old_status && h.old_status !== '')).length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">ยังไม่มีประวัติการอัพเดทสถานะ</p>
              </div>
            )}
          </div>
        )}

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
        </div>
      </div>

      {/* ✅ Image Modal - ปรับปรุงให้รองรับรูปภาพแยกประเภท */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50"
          onClick={closeImageModal}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Navigation Buttons */}
            {((selectedImageType === 'regular' && regularImages.length > 1) || (selectedImageType === 'completion' && completionImages.length > 1)) && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className={`fixed ${isMobile ? 'left-4 top-1/2' : 'left-8 top-1/2'} transform -translate-y-1/2 z-20 rounded-full bg-black bg-opacity-80 hover:bg-opacity-90 transition-all duration-200 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} flex items-center justify-center shadow-xl active:scale-95`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <ChevronLeft className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className={`fixed ${isMobile ? 'right-4 top-1/2' : 'right-8 top-1/2'} transform -translate-y-1/2 z-20 rounded-full bg-black bg-opacity-80 hover:bg-opacity-90 transition-all duration-200 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} flex items-center justify-center shadow-xl active:scale-95`}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  <ChevronRight className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} />
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className={`fixed ${isMobile ? 'top-4 right-4' : 'top-8 right-8'} z-20 rounded-full bg-black bg-opacity-80 hover:bg-opacity-90 transition-all duration-200 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} flex items-center justify-center shadow-xl active:scale-95`}
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              <XCircle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
            </button>

            {/* Image Container */}
            <div className={`flex items-center justify-center w-full h-full ${isMobile ? 'px-20' : 'px-32'} py-8`}>
              {(() => {
                const currentImages = selectedImageType === 'completion' ? completionImages : regularImages;
                const currentImage = currentImages[selectedImageIndex];
                return currentImage ? (
                  <img
                    src={currentImage.url}
                    alt={currentImage.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    onError={(e) => handleImageError(e, selectedImageType)}
                    style={{
                      maxHeight: 'calc(100vh - 160px)',
                      maxWidth: '100%'
                    }}
                  />
                ) : null;
              })()}
            </div>

            {/* Image Info Panel */}
            <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent text-white ${isMobile ? 'p-4' : 'p-6'} z-10`}>
              <div className={`max-w-4xl mx-auto ${isMobile ? 'text-center' : 'flex items-center justify-between'}`}>
                <div className={isMobile ? 'mb-3' : ''}>
                  {(() => {
                    const currentImages = selectedImageType === 'completion' ? completionImages : regularImages;
                    const currentImage = currentImages[selectedImageIndex];
                    return currentImage ? (
                      <>
                        <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium truncate`}>
                          {currentImage.name}
                          {selectedImageType === 'completion' && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-green-600 text-white text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              งานเสร็จ
                            </span>
                          )}
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-300`}>
                          รูปที่ {selectedImageIndex + 1} จาก {currentImages.length} รูป
                          {selectedImageType === 'completion' ? ' (งานเสร็จสิ้น)' : ' (ประกอบ)'}
                        </p>
                      </>
                    ) : null;
                  })()}
                </div>
                
                {/* Progress Dots */}
                {(() => {
                  const currentImages = selectedImageType === 'completion' ? completionImages : regularImages;
                  return currentImages.length > 1 ? (
                    <div className="flex space-x-2 justify-center">
                      {currentImages.map((_, index) => (
                        <button
                          key={index}
                          className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full transition-all duration-200 ${
                            index === selectedImageIndex 
                              ? `scale-110 ${selectedImageType === 'completion' ? 'bg-green-500' : 'bg-white'}` 
                              : `${selectedImageType === 'completion' ? 'bg-green-300' : 'bg-white'} bg-opacity-50 hover:bg-opacity-80`
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex(index);
                          }}
                        />
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Touch Gesture Handler for Mobile */}
      {isMobile && isImageModalOpen && (
        <div
          className="fixed inset-0 z-30"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            e.currentTarget.startX = touch.clientX;
            e.currentTarget.startY = touch.clientY;
            e.currentTarget.startTime = Date.now();
          }}
          onTouchMove={(e) => {
            e.preventDefault();
          }}
          onTouchEnd={(e) => {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - e.currentTarget.startX;
            const deltaY = touch.clientY - e.currentTarget.startY;
            const deltaTime = Date.now() - e.currentTarget.startTime;
            const threshold = 50;
            const maxTime = 300;

            if (Math.abs(deltaX) > Math.abs(deltaY) && 
                Math.abs(deltaX) > threshold && 
                deltaTime < maxTime) {
              if (deltaX > 0) {
                prevImage();
              } else {
                nextImage();
              }
            }
          }}
          style={{
            touchAction: 'none'
          }}
        />
      )}
    </Layout>
  );
};

export default RepairDetail;