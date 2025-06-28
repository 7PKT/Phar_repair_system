import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Settings,
  Plus
} from 'lucide-react';

const RepairEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);

  // ข้อมูลอาคารและชั้น
  const buildings = {
    1: { name: 'อาคาร 1', floors: 2 },
    2: { name: 'อาคาร 2', floors: 4 },
    3: { name: 'อาคาร 3', floors: 5 },
    4: { name: 'อาคาร 4', floors: 5 },
    5: { name: 'อาคาร 5', floors: 4 },
    6: { name: 'อาคาร 6', floors: 2 },
    7: { name: 'อาคาร 7', floors: 5 },
    8: { name: 'อาคาร 8', floors: 2 },
    9: { name: 'อาคาร 9', floors: 1 }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    building: '',
    floor: '',
    room: '',
    priority: 'medium',
    status: 'pending',
    assigned_to: '',
    completion_details: ''
  });

  useEffect(() => {
    fetchRepairData();
    fetchCategories();
    if (user?.role === 'admin' || user?.role === 'technician') {
      fetchTechnicians();
    }
  }, [id, user?.role]);

  const fetchRepairData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/repairs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const repair = response.data;
      console.log('📋 Repair data loaded:', {
        id: repair.id,
        title: repair.title,
        hasImages: repair.images?.length > 0,
        hasLegacyImage: !!repair.image_path,
        imagesCount: repair.images?.length || 0
      });
      
      // ตรวจสอบสิทธิ์การแก้ไข
      if (!canEdit(repair)) {
        toast.error('คุณไม่มีสิทธิ์แก้ไขรายการนี้');
        navigate(`/repairs/${id}`);
        return;
      }

      // แยก location กลับเป็น building, floor, room
      let building = '';
      let floor = '';
      let room = '';
      
      if (repair.location) {
        // พยายามแยกข้อมูลจาก location string
        for (const [buildingId, buildingData] of Object.entries(buildings)) {
          if (repair.location.includes(buildingData.name)) {
            building = buildingId;
            break;
          }
        }
        
        const floorMatch = repair.location.match(/ชั้น\s*(\d+)/);
        if (floorMatch) {
          floor = floorMatch[1];
        }
        
        const roomMatch = repair.location.match(/ห้อง\s*(.+?)(?:\s|$)/);
        if (roomMatch) {
          room = roomMatch[1].trim();
        }
      }

      setFormData({
        title: repair.title || '',
        description: repair.description || '',
        category_id: repair.category_id || '',
        building: building,
        floor: floor,
        room: room,
        priority: repair.priority || 'medium',
        status: repair.status || 'pending',
        assigned_to: repair.assigned_to || '',
        completion_details: repair.completion_details || ''
      });

      // โหลดรูปภาพที่มีอยู่
      const processedImages = [];
      
      // 1. โหลดรูปภาพจากตาราง repair_images (ใหม่)
      if (repair.images && Array.isArray(repair.images) && repair.images.length > 0) {
        repair.images.forEach((img, index) => {
          processedImages.push({
            id: img.id,
            file_path: img.file_path,
            name: img.file_name || `รูปภาพ ${index + 1}`,
            url: `http://localhost:5000/${img.file_path}`,
            type: 'new'
          });
        });
        console.log('✅ Loaded images from repair_images table:', processedImages.length);
      }
      
      // 2. โหลดรูปภาพจาก image_path เก่า (fallback)
      if (repair.image_path && !processedImages.some(img => img.file_path === repair.image_path)) {
        processedImages.push({
          id: 'legacy',
          file_path: repair.image_path,
          name: 'รูปปัจจุบัน (เก่า)',
          url: `http://localhost:5000/${repair.image_path}`,
          type: 'legacy'
        });
        console.log('✅ Added legacy image:', repair.image_path);
      }
      
      setCurrentImages(processedImages);
      console.log('📷 Total images loaded:', processedImages.length);
      
      // ล้างรูปภาพใหม่ที่อาจค้างอยู่
      setSelectedImages([]);
      setImagePreviews([]);
      
    } catch (error) {
      console.error('❌ Error fetching repair:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      navigate('/repairs');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/repairs/categories', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([
        { id: 1, name: 'คอมพิวเตอร์' },
        { id: 2, name: 'เครือข่าย' },
        { id: 3, name: 'ไฟฟ้า' },
        { id: 4, name: 'ประปา' },
        { id: 5, name: 'แอร์' },
        { id: 6, name: 'อื่นๆ' }
      ]);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('token');
      
      let response;
      try {
        response = await axios.get('/api/repairs/technicians', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (techError) {
        try {
          response = await axios.get('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          response.data = response.data.filter(u =>
            u.role === 'technician' || u.role === 'admin'
          );
        } catch (adminError) {
          setTechnicians([]);
          return;
        }
      }
      
      setTechnicians(response.data || []);
    } catch (error) {
      setTechnicians([]);
    }
  };

  const canEdit = (repair) => {
    if (!user) return false;
    
    if (user.role === 'admin' || user.role === 'technician') {
      return true;
    }
    if (user.role === 'user' && repair.requester_id === user.id) {
      return repair.status === 'pending';
    }
    return false;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // ถ้าเปลี่ยนอาคาร ให้รีเซ็ตชั้น
    if (name === 'building') {
      setFormData({
        ...formData,
        [name]: value,
        floor: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    const validFiles = [];
    const newPreviews = [];
    let processedCount = 0;

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 5MB)`);
        processedCount++;
        if (processedCount === files.length && validFiles.length > 0) {
          updateImageState();
        }
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`);
        processedCount++;
        if (processedCount === files.length && validFiles.length > 0) {
          updateImageState();
        }
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          id: Date.now() + Math.random(),
          file: file,
          preview: e.target.result,
          name: file.name
        });

        processedCount++;
        if (processedCount === files.length) {
          updateImageState();
        }
      };
      reader.readAsDataURL(file);
    });

    const updateImageState = () => {
      if (validFiles.length > 0) {
        setSelectedImages(prev => [...prev, ...validFiles]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
        toast.success(`เพิ่มรูปภาพสำเร็จ ${validFiles.length} ไฟล์`);
      }
    };

    event.target.value = '';
  };

  const removeNewImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    toast.info('ลบรูปภาพใหม่แล้ว');
  };

  const removeCurrentImage = (index) => {
    setCurrentImages(prev => prev.filter((_, i) => i !== index));
    toast.info('ลบรูปภาพเดิมแล้ว');
  };

  // สร้างรายการชั้นตามอาคารที่เลือก
  const getFloorsForBuilding = (buildingId) => {
    if (!buildingId || !buildings[buildingId]) return [];
    
    const floors = [];
    for (let i = 1; i <= buildings[buildingId].floors; i++) {
      floors.push(i);
    }
    return floors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('กรุณากรอกหัวข้อ');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('กรุณากรอกรายละเอียด');
      return;
    }
    if (!formData.category_id) {
      toast.error('กรุณาเลือกหมวดหมู่');
      return;
    }
    if (!formData.building || !formData.floor || !formData.room.trim()) {
      toast.error('กรุณากรอกข้อมูลสถานที่ให้ครบถ้วน');
      return;
    }

    if (formData.status === 'completed' && !formData.completion_details.trim()) {
      toast.error('กรุณาใส่รายละเอียดการซ่อมเมื่อเปลี่ยนสถานะเป็นเสร็จสิ้น');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category_id', formData.category_id);
      
      // รวมสถานที่เป็น location string
      const location = `${buildings[formData.building].name} ชั้น ${formData.floor} ห้อง ${formData.room.trim()}`;
      submitData.append('location', location);
      submitData.append('priority', formData.priority);

      // เพิ่มรูปภาพใหม่ทั้งหมด
      selectedImages.forEach((image) => {
        submitData.append('images', image);
      });

      // ปรับปรุงการส่งข้อมูลรูปภาพเดิมที่ต้องการเก็บไว้
      const keepImageData = currentImages.map(img => {
        if (img.id === 'legacy' || img.type === 'legacy') {
          // สำหรับรูปเก่าจาก image_path
          return {
            type: 'legacy',
            path: img.file_path
          };
        } else {
          // สำหรับรูปใหม่จาก repair_images table
          return {
            type: 'new',
            id: img.id,
            path: img.file_path
          };
        }
      });
      
      submitData.append('keep_images', JSON.stringify(keepImageData));

      console.log('Submitting data:', {
        title: formData.title,
        newImagesCount: selectedImages.length,
        keepImagesCount: currentImages.length,
        keepImageData: keepImageData
      });

      // สร้าง axios instance ที่มี timeout ยาวขึ้น
      const apiClient = axios.create({
        timeout: 300000, // 5 minutes
      });

      const response = await apiClient.put(`/api/repairs/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log('Upload progress:', percentCompleted + '%');
        }
      });

      console.log('Update response:', response.data);

      // สำหรับ Admin/Technician - อัพเดทสถานะแยกต่างหาก
      if (user?.role === 'admin' || user?.role === 'technician') {
        const statusData = {
          status: formData.status,
          assigned_to: formData.assigned_to || null,
          completion_details: formData.completion_details || null
        };

        const statusResponse = await axios.put(`/api/repairs/${id}/status`, statusData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });

        console.log('Status update response:', statusResponse.data);
      }

      toast.success('อัพเดทข้อมูลสำเร็จ! 🎉');
      navigate(`/repairs/${id}`);
    } catch (error) {
      console.error('Update error:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('การอัปโหลดใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
      } else {
        const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดท';
        toast.error(message);
        
        // แสดงข้อมูล debug เพิ่มเติม
        if (error.response?.data) {
          console.error('Server error details:', error.response.data);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  // เพิ่มฟังก์ชันสำหรับดู debug ข้อมูลรูปภาพ
  const debugImageData = () => {
    console.log('🔍 Current Image Debug Info:', {
      currentImages: currentImages.map(img => ({
        id: img.id,
        type: img.type,
        path: img.file_path,
        name: img.name
      })),
      selectedImages: selectedImages.map(img => ({
        name: img.name,
        size: img.size,
        type: img.type
      })),
      imagePreviews: imagePreviews.map(prev => ({
        id: prev.id,
        name: prev.name
      }))
    });
  };

  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const canManageStatus = isAdmin || isTechnician;
  const showDebugInfo = process.env.NODE_ENV === 'development';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/repairs/${id}`)}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                กลับ
              </button>
              <h1 className="text-xl font-bold text-blue-600">แก้ไขการแจ้งซ่อม</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">ข้อมูลพื้นฐาน</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หัวข้อ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="เช่น ไฟดับในห้องประชุม"
                  maxLength={200}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระดับความสำคัญ <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">ต่ำ</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="high">สูง</option>
                  <option value="urgent">เร่งด่วน</option>
                </select>
              </div>

              {/* Location Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานที่ <span className="text-red-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Building */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      อาคาร
                    </label>
                    <select
                      name="building"
                      value={formData.building}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">เลือกอาคาร</option>
                      {Object.entries(buildings).map(([id, building]) => (
                        <option key={id} value={id}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Floor */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      ชั้น
                    </label>
                    <select
                      name="floor"
                      value={formData.floor}
                      onChange={handleInputChange}
                      disabled={!formData.building}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">เลือกชั้น</option>
                      {getFloorsForBuilding(formData.building).map(floor => (
                        <option key={floor} value={floor}>
                          ชั้น {floor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      ห้อง
                    </label>
                    <input
                      type="text"
                      name="room"
                      value={formData.room}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="เช่น 101, ห้องประชุม"
                    />
                  </div>
                </div>

                {/* Location Preview */}
                {formData.building && formData.floor && formData.room && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      📍 <strong>สถานที่:</strong> {buildings[formData.building].name} ชั้น {formData.floor} ห้อง {formData.room}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รายละเอียด <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="อธิบายปัญหาที่พบอย่างละเอียด..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Status Management - สำหรับ Admin/Technician เท่านั้น */}
          {canManageStatus && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <Settings className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">จัดการสถานะ</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="assigned">มอบหมายแล้ว</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    มอบหมายให้
                  </label>
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">ไม่มอบหมาย</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name} ({tech.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Completion Details */}
                {formData.status === 'completed' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รายละเอียดการซ่อม <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="completion_details"
                      value={formData.completion_details}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="อธิบายวิธีการซ่อมและผลลัพธ์..."
                      required={formData.status === 'completed'}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">จัดการรูปภาพ</h2>

            {/* Current Images */}
            {currentImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">รูปภาพปัจจุบัน ({currentImages.length} รูป)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {currentImages.map((image, index) => (
                    <div key={`current-${index}`} className="relative group">
                      <img
                        src={image.url}
                        alt={`Current ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          console.error('Image load error:', image.url);
                          e.target.src = '/placeholder-image.png'; // fallback image
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeCurrentImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                        {image.name || 'รูปปัจจุบัน'}
                      </div>
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                        เดิม {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {imagePreviews.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">รูปภาพใหม่ ({imagePreviews.length} รูป)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={preview.id} className="relative group">
                      <img
                        src={preview.preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs max-w-[80%] truncate">
                        {preview.name}
                      </div>
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        ใหม่ {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label htmlFor="images" className="cursor-pointer">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    {currentImages.length > 0 || imagePreviews.length > 0 ? 'เพิ่มรูปภาพเพิ่มเติม' : 'เพิ่มรูปภาพ'}
                  </span>
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  รองรับไฟล์ JPEG, PNG, GIF, WebP ขนาดไม่เกิน 5MB ต่อไฟล์
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  สามารถเลือกหลายไฟล์พร้อมกัน และเพิ่มรูปได้ไม่จำกัด
                </p>
              </div>
            </div>

            {/* Quick Add Button */}
            {(currentImages.length > 0 || imagePreviews.length > 0) && (
              <div className="mt-4 text-center">
                <label htmlFor="images-quick" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center">
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่มรูปอีก
                  </span>
                  <input
                    id="images-quick"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Debug Info - Development Only */}
            {showDebugInfo && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={debugImageData}
                  className="text-sm bg-gray-600 text-white px-3 py-1 rounded mr-2"
                >
                  Debug Image Data (Console)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    axios.get(`/api/repairs/${id}/images-debug`, {
                      headers: { Authorization: `Bearer ${token}` }
                    }).then(res => {
                      console.log('🔍 Server Image Debug:', res.data);
                    }).catch(err => {
                      console.log('Debug endpoint not available:', err);
                    });
                  }}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Server Debug (Console)
                </button>
                <div className="mt-2 text-xs text-gray-600">
                  <p>Current Images: {currentImages.length}</p>
                  <p>Selected New Images: {selectedImages.length}</p>
                  <p>Image Previews: {imagePreviews.length}</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/repairs/${id}`)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default RepairEdit;