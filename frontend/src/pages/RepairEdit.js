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
  Plus,
  Building,
  MapPin,
  Camera,
  CheckCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

const RepairEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);

  const [completionImages, setCompletionImages] = useState([]);
  const [completionImagePreviews, setCompletionImagePreviews] = useState([]);
  const [currentCompletionImages, setCurrentCompletionImages] = useState([]);
  const [selectedRoomName, setSelectedRoomName] = useState('');

  const [locationType, setLocationType] = useState('');
  const [isMobile, setIsMobile] = useState(false);

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

  const buildings = {
    1: { name: 'อาคาร 1', floors: 3 },
    2: { name: 'อาคาร 2', floors: 4 },
    3: { name: 'อาคาร 3', floors: 5 },
    4: { name: 'อาคาร 4', floors: 6 },
    5: { name: 'อาคาร 5', floors: 4 },
    6: { name: 'อาคาร 6', floors: 2 },
    7: { name: 'อาคาร 7', floors: 1 },
    8: { name: 'อาคาร 8', floors: 1 },
    9: { name: 'อาคาร 9', floors: 1 }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    building: '',
    floor: '',
    room: '',
    outdoor_location: '',
    priority: 'medium',
    status: 'pending',
    assigned_to: '',
    completion_details: ''
  });

  const [errors, setErrors] = useState({});

  const createPlaceholderImage = () => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <g>
          <rect x="35" y="25" width="30" height="20" fill="#d1d5db" rx="2"/>
          <circle cx="42" cy="32" r="3" fill="#9ca3af"/>
          <polygon points="60,40 50,30 55,25 65,35 75,25 85,35 85,45 35,45" fill="#d1d5db"/>
        </g>
        <text x="50" y="65" font-family="Arial, sans-serif" font-size="8" fill="#6b7280" text-anchor="middle">ไม่พบรูปภาพ</text>
      </svg>
    `)}`;
  };

  const TouchButton = ({ onClick, children, className = "", disabled = false, variant = "primary", type = "button" }) => {
    const baseClasses = "relative overflow-hidden transition-all duration-200 active:scale-95 select-none";
    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl",
      secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border border-gray-300",
      danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg hover:shadow-xl",
      ghost: "hover:bg-gray-100 active:bg-gray-200 text-gray-700",
      outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100"
    };

    const touchSizeClasses = isMobile ? "min-h-[48px] min-w-[48px] px-4 py-3" : "px-4 py-2";

    return (
      <button
        type={type}
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

  useEffect(() => {
    fetchRepairData();
    fetchCategories();
    if (user?.role === 'admin' || user?.role === 'technician') {
      fetchTechnicians();
    }
  }, [id, user?.role]);

  useEffect(() => {
    if (formData.building && formData.floor !== '') {
      fetchRooms(formData.building, formData.floor);
    } else {
      setRooms([]);
    }
  }, [formData.building, formData.floor]);

  // เพิ่ม useEffect ใหม่ตรงนี้
  useEffect(() => {
    // เมื่อ rooms โหลดเสร็จแล้ว ตรวจสอบว่าห้องที่เลือกไว้ยังอยู่ในรายการหรือไม่
    if (rooms.length > 0 && formData.room && selectedRoomName) {
      const foundRoom = rooms.find(room =>
        room.name === selectedRoomName ||
        room.id.toString() === formData.room
      );

      if (foundRoom) {
        // ถ้าเจอห้องในรายการ ให้อัปเดต formData.room เป็น ID
        if (formData.room !== foundRoom.id.toString()) {
          setFormData(prev => ({
            ...prev,
            room: foundRoom.id.toString()
          }));
        }
      }
      // ถ้าไม่เจอ ให้เก็บค่าเดิมไว้ (formData.room จะยังคงเป็นชื่อห้องเดิม)
    }
  }, [rooms, selectedRoomName]); // ไม่ใส่ formData.room ใน dependency เพื่อหลีกเลี่ยง infinite loop

  const fetchRooms = async (building, floor) => {
    try {
      setRoomsLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/rooms/by-building-floor?building=${building}&floor=${floor}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setRooms(response.data.data || []);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);

      if (error.response?.status === 401) {
        toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/login');
      } else if (error.response?.status !== 404) {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง');
      }
    } finally {
      setRoomsLoading(false);
    }
  };

  // ฟังก์ชันแก้ไขการแยกชื่อห้องจาก location string ใน RepairEdit.js
  // แทนที่โค้ดเดิมในส่วน fetchRepairData

  const parseLocationString = (locationString, buildings) => {
    let building = '';
    let floor = '';
    let room = '';
    let outdoor_location = '';
    let detectedLocationType = '';

    if (!locationString) {
      return { building, floor, room, outdoor_location, detectedLocationType };
    }

    if (locationString.includes('ภายนอกอาคาร:')) {
      detectedLocationType = 'outdoor';
      outdoor_location = locationString.replace('ภายนอกอาคาร:', '').trim();
    } else {
      detectedLocationType = 'indoor';

      // หาอาคารจาก location string
      for (const [buildingId, buildingData] of Object.entries(buildings)) {
        if (locationString.includes(buildingData.name)) {
          building = buildingId;
          break;
        }
      }

      // หาชั้น
      if (locationString.includes('ใต้ดิน')) {
        floor = '0';
      } else if (locationString.includes('ดาดฟ้า')) {
        floor = '6';
      } else {
        const floorMatch = locationString.match(/ชั้น\s*(\d+)/);
        if (floorMatch) {
          floor = floorMatch[1];
        }
      }

      // หาห้อง - ปรับปรุงการดึงชื่อห้องให้ครบถ้วน
      if (building && floor !== '') {
        const buildingName = buildings[building].name;
        const floorText = floor === '0' ? 'ใต้ดิน' :
          building === '4' && floor === '6' ? 'ดาดฟ้า' :
            `ชั้น ${floor}`;

        // สร้าง pattern ที่แม่นยำยิ่งขึ้น
        const prefixPattern = `${buildingName}\\s+${floorText}\\s+`;
        const regex = new RegExp(prefixPattern + '(.+?)$');
        const match = locationString.match(regex);

        if (match && match[1]) {
          room = match[1].trim();
        } else {
          // ถ้าไม่เจอด้วย regex ให้ใช้วิธีแยกด้วย split
          const parts = locationString.split(' ');
          if (parts.length > 2) {
            // ค้นหา index ที่เริ่มต้นหลังจากอาคารและชั้น
            const buildingIndex = parts.findIndex(part => part === buildingName.split(' ')[0]);
            const floorPart = floor === '0' ? 'ใต้ดิน' :
              building === '4' && floor === '6' ? 'ดาดฟ้า' :
                'ชั้น';
            const floorIndex = parts.findIndex((part, idx) => idx > buildingIndex && part === floorPart);

            if (floorIndex !== -1) {
              // เอาทุกอย่างหลังจากข้อมูลชั้น
              const roomParts = parts.slice(floorIndex + (floorPart === 'ชั้น' ? 2 : 1));
              room = roomParts.join(' ').trim();
            }
          }
        }
      }
    }

    return { building, floor, room, outdoor_location, detectedLocationType };
  };

  // ฟังก์ชันปรับปรุง fetchRepairData
  const fetchRepairData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/repairs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const repair = response.data;

      if (!canEdit(repair)) {
        toast.error('คุณไม่มีสิทธิ์แก้ไขรายการนี้');
        navigate(`/repairs/${id}`);
        return;
      }

      // ใช้ฟังก์ชันใหม่ในการแยกข้อมูล location
      const {
        building,
        floor,
        room: parsedRoom,
        outdoor_location,
        detectedLocationType
      } = parseLocationString(repair.location, buildings);

      setLocationType(detectedLocationType);

      // ตั้งค่าข้อมูลเริ่มต้น
      setFormData({
        title: repair.title || '',
        description: repair.description || '',
        category_id: repair.category_id || '',
        building: building,
        floor: floor,
        room: parsedRoom, // ใช้ชื่อห้องที่แยกได้แล้ว
        outdoor_location: outdoor_location,
        priority: repair.priority || 'medium',
        status: repair.status || 'pending',
        assigned_to: repair.assigned_to || '',
        completion_details: repair.completion_details || ''
      });

      // ตั้งค่าชื่อห้องที่เลือก
      setSelectedRoomName(parsedRoom);

      // ถ้ามีอาคารและชั้น ให้ดึงข้อมูลห้องจากฐานข้อมูล
      if (building && floor !== '') {
        try {
          const roomsResponse = await axios.get(`${API_BASE_URL}/api/rooms/by-building-floor?building=${building}&floor=${floor}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (roomsResponse.data.success && roomsResponse.data.data.length > 0) {
            const availableRooms = roomsResponse.data.data;
            setRooms(availableRooms);

            // ตรวจสอบว่าห้องที่แยกได้อยู่ในรายการหรือไม่
            const foundRoom = availableRooms.find(room =>
              room.name === parsedRoom ||
              room.name.toLowerCase() === parsedRoom.toLowerCase() ||
              room.name.replace(/\s+/g, ' ').trim() === parsedRoom.replace(/\s+/g, ' ').trim()
            );

            if (foundRoom) {
              // ถ้าเจอในฐานข้อมูล ให้ใช้ ID
              setFormData(prev => ({
                ...prev,
                room: foundRoom.id.toString()
              }));
              setSelectedRoomName(foundRoom.name);
            } else {
              // ถ้าไม่เจอในฐานข้อมูล ให้เก็บชื่อห้องเดิม
              setSelectedRoomName(parsedRoom);
            }
          } else {
            // ถ้าไม่มีห้องในฐานข้อมูล ให้เก็บชื่อเดิม
            setRooms([]);
            setSelectedRoomName(parsedRoom);
          }
        } catch (roomError) {
          console.error('Error fetching rooms:', roomError);
          setRooms([]);
          setSelectedRoomName(parsedRoom);
        }
      }

      // จัดการรูปภาพ (เหมือนเดิม)
      const processedImages = [];
      if (repair.images && Array.isArray(repair.images) && repair.images.length > 0) {
        repair.images.forEach((img, index) => {
          processedImages.push({
            id: img.id,
            file_path: img.file_path,
            name: img.file_name || `รูปภาพ ${index + 1}`,
            url: `${API_BASE_URL}/${img.file_path}`,
            type: 'new'
          });
        });
      }

      if (repair.image_path && !processedImages.some(img => img.file_path === repair.image_path)) {
        processedImages.push({
          id: 'legacy',
          file_path: repair.image_path,
          name: 'รูปปัจจุบัน (เก่า)',
          url: `${API_BASE_URL}/${repair.image_path}`,
          type: 'legacy'
        });
      }

      setCurrentImages(processedImages);
      setSelectedImages([]);
      setImagePreviews([]);

      const processedCompletionImages = [];
      if (repair.completion_images && Array.isArray(repair.completion_images) && repair.completion_images.length > 0) {
        repair.completion_images.forEach((img, index) => {
          processedCompletionImages.push({
            id: img.id,
            file_path: img.file_path,
            name: img.file_name || `รูปเสร็จสิ้น ${index + 1}`,
            url: `${API_BASE_URL}/${img.file_path}`,
            type: 'completion'
          });
        });
      }

      setCurrentCompletionImages(processedCompletionImages);
      setCompletionImages([]);
      setCompletionImagePreviews([]);

    } catch (error) {
      console.error('Fetch repair data error:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      navigate('/repairs');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/repairs/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let categoriesData = [];
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data.categories && Array.isArray(response.data.categories)) {
        categoriesData = response.data.categories;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      }

      setCategories(categoriesData);

      if (categoriesData.length === 0) {
        const defaultCategories = [
          { id: 1, name: 'คอมพิวเตอร์' },
          { id: 2, name: 'เครือข่าย' },
          { id: 3, name: 'ไฟฟ้า' },
          { id: 4, name: 'ประปา' },
          { id: 5, name: 'แอร์' },
          { id: 6, name: 'อื่นๆ' }
        ];
        setCategories(defaultCategories);
        toast.info('ใช้หมวดหมู่เริ่มต้น');
      }
    } catch (error) {
      const defaultCategories = [
        { id: 1, name: 'คอมพิวเตอร์' },
        { id: 2, name: 'เครือข่าย' },
        { id: 3, name: 'ไฟฟ้า' },
        { id: 4, name: 'ประปา' },
        { id: 5, name: 'แอร์' },
        { id: 6, name: 'อื่นๆ' }
      ];
      setCategories(defaultCategories);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('token');

      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/api/repairs/technicians`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (techError) {
        try {
          response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
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

    if (user.role === 'admin') {
      return true;
    }

    if (user.role === 'technician') {
      return true;
    }

    if (user.role === 'user' && repair.requester_id === user.id) {
      return repair.status === 'pending';
    }
    return false;
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.status === 'completed') {
      if (!formData.completion_details || !formData.completion_details.trim()) {
        newErrors.completion_details = 'กรุณาใส่รายละเอียดการซ่อมเมื่อเปลี่ยนสถานะเป็นเสร็จสิ้น';
      }
    }

    if (!formData.title.trim()) {
      newErrors.title = 'กรุณากรอกหัวข้อ';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'หัวข้อต้องมีความยาวอย่างน้อย 5 ตัวอักษร';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'หัวข้อต้องมีความยาวไม่เกิน 200 ตัวอักษร';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'กรุณากรอกรายละเอียด';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'รายละเอียดต้องมีความยาวอย่างน้อย 10 ตัวอักษร';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'กรุณาเลือกหมวดหมู่';
    }

    if (!locationType) {
      newErrors.location = 'กรุณาเลือกประเภทสถานที่';
    }

    if (locationType === 'indoor') {
      if (!formData.building) {
        newErrors.building = 'กรุณาเลือกอาคาร';
      }
      if (formData.floor === '') {
        newErrors.floor = 'กรุณาเลือกชั้น';
      }
      if (!formData.room && !selectedRoomName) {
        newErrors.room = 'กรุณาเลือกห้อง';
      }
    } else if (locationType === 'outdoor') {
      if (!formData.outdoor_location.trim()) {
        newErrors.outdoor_location = 'กรุณากรอกรายละเอียดสถานที่';
      } else if (formData.outdoor_location.trim().length < 5) {
        newErrors.outdoor_location = 'รายละเอียดสถานที่ต้องมีความยาวอย่างน้อย 5 ตัวอักษร';
      }
    }

    if (!formData.priority) {
      newErrors.priority = 'กรุณาเลือกระดับความสำคัญ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'building') {
      setFormData({
        ...formData,
        [name]: value,
        floor: ''
        // ไม่ reset room ให้เก็บค่าเดิมไว้
      });
      setRooms([]);
      // ไม่ reset selectedRoomName ด้วย เพื่อให้แสดงชื่อห้องเดิม
    } else if (name === 'floor') {
      setFormData({
        ...formData,
        [name]: value
        // ไม่ reset room ให้เก็บค่าเดิมไว้
      });
      // ไม่ reset selectedRoomName ด้วย เพื่อให้แสดงชื่อห้องเดิม
    } else if (name === 'room') {
      setFormData({
        ...formData,
        [name]: value
      });
      // อัปเดตชื่อห้องที่เลือก
      if (rooms.length > 0) {
        const selectedRoom = rooms.find(room => room.id.toString() === value);
        if (selectedRoom) {
          setSelectedRoomName(selectedRoom.name);
        } else {
          setSelectedRoomName(value);
        }
      } else {
        setSelectedRoomName(value);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleLocationTypeChange = (type) => {
    setLocationType(type);
    setFormData({
      ...formData,
      building: '',
      floor: '',
      room: '',
      outdoor_location: ''
    });
    setRooms([]);
    const newErrors = { ...errors };
    delete newErrors.building;
    delete newErrors.floor;
    delete newErrors.room;
    delete newErrors.outdoor_location;
    delete newErrors.location;
    setErrors(newErrors);
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    const validFiles = [];
    const newPreviews = [];
    const maxFileSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    let processedCount = 0;
    const totalFiles = files.length;

    const updateImageState = () => {
      if (validFiles.length > 0) {
        setSelectedImages(prev => {
          const updatedImages = [...prev, ...validFiles];
          return updatedImages;
        });

        setImagePreviews(prev => {
          const updatedPreviews = [...prev, ...newPreviews];
          return updatedPreviews;
        });

        toast.success(`เพิ่มรูปภาพสำเร็จ ${validFiles.length} ไฟล์`);
      }
    };

    files.forEach((file, index) => {
      if (file.size > maxFileSize) {
        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 5MB)`);
        processedCount++;
        if (processedCount === totalFiles && validFiles.length > 0) {
          updateImageState();
        }
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`);
        processedCount++;
        if (processedCount === totalFiles && validFiles.length > 0) {
          updateImageState();
        }
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const previewData = {
          id: Date.now() + Math.random() + index,
          file: file,
          preview: e.target.result,
          name: file.name
        };

        newPreviews.push(previewData);

        processedCount++;

        if (processedCount === totalFiles) {
          updateImageState();
        }
      };

      reader.onerror = (error) => {
        toast.error(`เกิดข้อผิดพลาดในการอ่านไฟล์ ${file.name}`);
        processedCount++;
        if (processedCount === totalFiles && validFiles.length > 0) {
          updateImageState();
        }
      };

      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const handleCompletionImageChange = (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    const validFiles = [];
    const newPreviews = [];
    const maxFileSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    let processedCount = 0;
    const totalFiles = files.length;

    const updateImageState = () => {
      if (validFiles.length > 0) {
        setCompletionImages(prev => {
          const updatedImages = [...prev, ...validFiles];
          return updatedImages;
        });

        setCompletionImagePreviews(prev => {
          const updatedPreviews = [...prev, ...newPreviews];
          return updatedPreviews;
        });

        toast.success(`เพิ่มรูปภาพงานเสร็จสิ้นสำเร็จ ${validFiles.length} ไฟล์`);
      }
    };

    files.forEach((file, index) => {
      if (file.size > maxFileSize) {
        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 5MB)`);
        processedCount++;
        if (processedCount === totalFiles && validFiles.length > 0) {
          updateImageState();
        }
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`);
        processedCount++;
        if (processedCount === totalFiles && validFiles.length > 0) {
          updateImageState();
        }
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const previewData = {
          id: Date.now() + Math.random() + index,
          file: file,
          preview: e.target.result,
          name: file.name
        };

        newPreviews.push(previewData);

        processedCount++;

        if (processedCount === totalFiles) {
          updateImageState();
        }
      };

      reader.onerror = (error) => {
        toast.error(`เกิดข้อผิดพลาดในการอ่านไฟล์ ${file.name}`);
        processedCount++;
        if (processedCount === totalFiles && validFiles.length > 0) {
          updateImageState();
        }
      };

      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const removeImage = (index) => {
    setSelectedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      return newImages;
    });

    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      return newPreviews;
    });

    toast.success('ลบรูปภาพแล้ว');
  };

  const removeCurrentImage = (index) => {
    setCurrentImages(prev => prev.filter((_, i) => i !== index));
    toast.success('ลบรูปภาพเดิมแล้ว');
  };

  const removeCompletionImage = (index) => {
    setCompletionImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      return newImages;
    });

    setCompletionImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      return newPreviews;
    });

    toast.info('ลบรูปภาพงานเสร็จสิ้นแล้ว');
  };

  const removeCurrentCompletionImage = (index) => {
    setCurrentCompletionImages(prev => prev.filter((_, i) => i !== index));
    toast.success('ลบรูปภาพงานเสร็จสิ้นเดิมแล้ว');
  };

  const getFloorsForBuilding = (buildingId) => {
    if (!buildingId || !buildings[buildingId]) return [];

    const floors = [];
    const maxFloors = buildings[buildingId].floors;

    if (buildingId === '4') {
      floors.push({ value: 0, label: 'ใต้ดิน' });
    }

    for (let i = 1; i <= maxFloors; i++) {
      if (buildingId === '4' && i === 6) {
        floors.push({ value: i, label: 'ดาดฟ้า' });
      } else {
        floors.push({ value: i, label: `ชั้น ${i}` });
      }
    }

    return floors;
  };

  const handleImageError = (e) => {
    console.warn('Image load error:', e.target.src);
    e.target.src = createPlaceholderImage();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      const submitData = new FormData();

      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('category_id', formData.category_id);

      let location = '';
      if (locationType === 'indoor') {
        let roomName;

        // ตรวจสอบว่า room เป็น ID หรือชื่อ
        if (rooms.length > 0) {
          const selectedRoom = rooms.find(room => room.id === parseInt(formData.room));
          roomName = selectedRoom ? selectedRoom.name : formData.room;
        } else {
          // ถ้าไม่มีข้อมูลห้องจากฐานข้อมูล ให้ใช้ค่าจาก formData
          roomName = formData.room;
        }

        const floorLabel = formData.floor === '0' ? 'ใต้ดิน' :
          formData.building === '4' && formData.floor === '6' ? 'ดาดฟ้า' :
            `ชั้น ${formData.floor}`;

        location = `${buildings[formData.building].name} ${floorLabel} ${roomName}`;
      } else if (locationType === 'outdoor') {
        location = `ภายนอกอาคาร: ${formData.outdoor_location.trim()}`;
      }

      submitData.append('location', location);
      submitData.append('priority', formData.priority);

      if (user?.role === 'admin' || user?.role === 'technician') {
        submitData.append('status', formData.status);
        submitData.append('assigned_to', formData.assigned_to || '');
        submitData.append('completion_details', formData.completion_details || '');

        const keepCompletionImageData = currentCompletionImages.map(img => ({
          id: img.id,
          path: img.file_path
        }));

        submitData.append('keep_completion_images', JSON.stringify(keepCompletionImageData));

        completionImages.forEach((image) => {
          submitData.append('completion_images', image);
        });
      }

      selectedImages.forEach((image, index) => {
        submitData.append(`images`, image);
      });

      const keepImageData = currentImages.map(img => {
        if (img.id === 'legacy' || img.type === 'legacy') {
          return {
            type: 'legacy',
            path: img.file_path
          };
        } else {
          return {
            type: 'new',
            id: img.id,
            path: img.file_path
          };
        }
      });

      submitData.append('keep_images', JSON.stringify(keepImageData));

      const apiClient = axios.create({
        timeout: 300000,
      });

      // ใช้ endpoint เดียวกันสำหรับทุกคน แต่ส่งข้อมูลต่างกัน
      const response = await apiClient.put(`${API_BASE_URL}/api/repairs/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.repair && response.data.repair.id) {
        navigate(`/repairs/${response.data.repair.id}`);
      } else if (response.data.id) {
        navigate(`/repairs/${response.data.id}`);
      } else {
        navigate(`/repairs/${id}`);
      }

      toast.success('อัพเดทข้อมูลสำเร็จ! 🎉', {
        duration: 3000
      });

    } catch (error) {
      console.error('Submit error:', error);

      if (error.code === 'ECONNABORTED') {
        toast.error('การอัปโหลดใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
      } else if (error.response?.status === 401) {
        toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('ไม่มีสิทธิ์แก้ไขการแจ้งซ่อม');
      } else if (error.response?.status === 422) {
        const serverErrors = error.response.data.errors || {};
        const errorMessages = Object.values(serverErrors).flat();
        if (errorMessages.length > 0) {
          toast.error(`ข้อมูลไม่ถูกต้อง: ${errorMessages.join(', ')}`);
        } else {
          toast.error('ข้อมูลที่กรอกไม่ถูกต้อง');
        }
      } else if (error.response?.status >= 500) {
        toast.error('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ภายหลัง');
      } else {
        const message = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัพเดท';
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const canManageStatus = isAdmin || isTechnician;
  const canEditDetails = user?.role === 'user' || isAdmin;

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id == categoryId);
    return category ? category.name : 'ไม่ระบุ';
  };

  const getPriorityText = (priority) => {
    const priorities = {
      low: 'ต่ำ - ไม่เร่งด่วน',
      medium: 'ปานกลาง - ดำเนินการตามปกติ',
      high: 'สูง - ต้องดำเนินการโดยเร็ว',
      urgent: 'เร่งด่วน - ต้องดำเนินการทันที'
    };
    return priorities[priority] || priority;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-xl font-bold text-blue-600">
                {canEditDetails ? 'แก้ไขการแจ้งซ่อม' : 'จัดการสถานะการซ่อม'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto py-6 px-4 sm:px-6 lg:px-8 ${isMobile ? 'max-w-full' : 'max-w-4xl'}`} style={{ paddingBottom: isMobile ? '80px' : '0' }}>
        <form onSubmit={handleSubmit} className={`space-y-${isMobile ? '4' : '6'}`}>

          {!canEditDetails && (
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
                  รายละเอียดการแจ้งซ่อม
                </h2>
                <p className={`text-gray-600 mt-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {isMobile ? 'ข้อมูลการแจ้งซ่อม' : 'ข้อมูลการแจ้งซ่อมที่ต้องดำเนินการ'}
                </p>
              </div>

              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
                <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    หัวข้อ
                  </label>
                  <div className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg bg-gray-50 ${isMobile ? 'text-base' : 'text-sm'}`}>
                    {formData.title}
                  </div>
                </div>

                <div>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    หมวดหมู่
                  </label>
                  <div className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg bg-gray-50 ${isMobile ? 'text-base' : 'text-sm'}`}>
                    {getCategoryName(formData.category_id)}
                  </div>
                </div>

                <div>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    ระดับความสำคัญ
                  </label>
                  <div className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg bg-gray-50 ${isMobile ? 'text-base' : 'text-sm'}`}>
                    {getPriorityText(formData.priority)}
                  </div>
                </div>

                <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    สถานที่
                  </label>
                  <div className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg bg-gray-50 ${isMobile ? 'text-base' : 'text-sm'}`}>
                    {locationType === 'indoor' && formData.building && formData.floor !== '' && formData.room
                      ? `${buildings[formData.building].name} ${formData.floor === '0' ? 'ใต้ดิน' :
                        formData.building === '4' && formData.floor === '6' ? 'ดาดฟ้า' :
                          `ชั้น ${formData.floor}`
                      } ${formData.room}`
                      : locationType === 'outdoor' && formData.outdoor_location
                        ? `ภายนอกอาคาร: ${formData.outdoor_location}`
                        : 'ไม่ระบุ'
                    }
                  </div>
                </div>

                <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    รายละเอียด
                  </label>
                  <div className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg bg-gray-50 ${isMobile ? 'text-base' : 'text-sm'} min-h-[80px] whitespace-pre-wrap`}>
                    {formData.description}
                  </div>
                </div>
              </div>
            </div>
          )}

          {canEditDetails && (
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
                  แก้ไขรายละเอียดการแจ้งซ่อม
                </h2>
                <p className={`text-gray-600 mt-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {isMobile ? 'กรอกข้อมูลให้ครบถ้วน' : 'กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้เราสามารถดำเนินการได้อย่างรวดเร็ว'}
                </p>

                {selectedImages.length > 0 && (
                  <div className="mt-2 text-sm text-blue-600">
                    🖼️ เลือกรูปภาพแล้ว: {selectedImages.length} รูป
                  </div>
                )}
              </div>

              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
                <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    หัวข้อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'
                      } ${isMobile ? 'text-base' : 'text-sm'}`}
                    placeholder="เช่น ไฟดับในห้องประชุม, คอมพิวเตอร์เปิดไม่ติด"
                    maxLength={200}
                    style={{ fontSize: isMobile ? '16px' : '14px' }}
                    required
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.title.length}/200 ตัวอักษร
                  </p>
                </div>

                <div>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    หมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.category_id ? 'border-red-300' : 'border-gray-300'
                      } ${isMobile ? 'text-base' : 'text-sm'}`}
                    style={{ fontSize: isMobile ? '16px' : '14px' }}
                    required
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                  )}
                </div>

                <div>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    ระดับความสำคัญ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.priority ? 'border-red-300' : 'border-gray-300'
                      } ${isMobile ? 'text-base' : 'text-sm'}`}
                    style={{ fontSize: isMobile ? '16px' : '14px' }}
                  >
                    <option value="low">ต่ำ - ไม่เร่งด่วน</option>
                    <option value="medium">ปานกลาง - ดำเนินการตามปกติ</option>
                    <option value="high">สูง - ต้องดำเนินการโดยเร็ว</option>
                    <option value="urgent">เร่งด่วน - ต้องดำเนินการทันที</option>
                  </select>
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
                  )}
                </div>

                <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-3`}>
                    ประเภทสถานที่ <span className="text-red-500">*</span>
                  </label>
                  <div className={`grid grid-cols-2 gap-3`}>
                    <TouchButton
                      onClick={() => handleLocationTypeChange('indoor')}
                      variant={locationType === 'indoor' ? 'primary' : 'outline'}
                      className={`${isMobile ? 'p-4' : 'p-3'} flex-col`}
                    >
                      <Building className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} mb-2`} />
                      <span className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium`}>ภายในอาคาร</span>
                    </TouchButton>
                    <TouchButton
                      onClick={() => handleLocationTypeChange('outdoor')}
                      variant={locationType === 'outdoor' ? 'primary' : 'outline'}
                      className={`${isMobile ? 'p-4' : 'p-3'} flex-col`}
                    >
                      <MapPin className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} mb-2`} />
                      <span className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium`}>ภายนอกอาคาร</span>
                    </TouchButton>
                  </div>
                  {errors.location && (
                    <p className="mt-2 text-sm text-red-600">{errors.location}</p>
                  )}
                </div>

                {locationType && (
                  <div className={`${isMobile ? '' : 'md:col-span-2'} space-y-4`}>
                    {locationType === 'indoor' ? (
                      <>
                        <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700`}>
                          รายละเอียดสถานที่ <span className="text-red-500">*</span>
                        </label>

                        <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-3 gap-4'}`}>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              อาคาร
                            </label>
                            <select
                              name="building"
                              value={formData.building}
                              onChange={handleInputChange}
                              className={`w-full ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.building ? 'border-red-300' : 'border-gray-300'
                                } ${isMobile ? 'text-base' : 'text-sm'}`}
                              style={{ fontSize: isMobile ? '16px' : '14px' }}
                            >
                              <option value="">เลือกอาคาร</option>
                              {Object.entries(buildings).map(([id, building]) => (
                                <option key={id} value={id}>
                                  {building.name}
                                </option>
                              ))}
                            </select>
                            {errors.building && (
                              <p className="mt-1 text-xs text-red-600">{errors.building}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              ชั้น
                            </label>
                            <select
                              name="floor"
                              value={formData.floor}
                              onChange={handleInputChange}
                              disabled={!formData.building}
                              className={`w-full ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.floor ? 'border-red-300' : 'border-gray-300'
                                } ${isMobile ? 'text-base' : 'text-sm'}`}
                              style={{ fontSize: isMobile ? '16px' : '14px' }}
                            >
                              <option value="">เลือกชั้น</option>
                              {getFloorsForBuilding(formData.building).map(floor => (
                                <option key={floor.value} value={floor.value}>
                                  {floor.label}
                                </option>
                              ))}
                            </select>
                            {errors.floor && (
                              <p className="mt-1 text-xs text-red-600">{errors.floor}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              ห้อง
                            </label>
                            {roomsLoading ? (
                              <div className={`w-full ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border rounded-lg border-gray-300 bg-gray-50 flex items-center justify-center ${isMobile ? 'text-base' : 'text-sm'}`}>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                กำลังโหลด...
                              </div>
                            ) : rooms.length > 0 ? (
                              <select
                                name="room"
                                value={formData.room}
                                onChange={handleInputChange}
                                disabled={!formData.building || formData.floor === ''}
                                className={`w-full ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.room ? 'border-red-300' : 'border-gray-300'
                                  } ${isMobile ? 'text-base' : 'text-sm'}`}
                                style={{ fontSize: isMobile ? '16px' : '14px' }}
                              >
                                <option value="">เลือกห้อง</option>
                                {rooms.map((room) => (
                                  <option key={room.id} value={room.id}>
                                    {room.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                name="room"
                                value={formData.room}
                                onChange={handleInputChange}
                                disabled={!formData.building || formData.floor === ''}
                                className={`w-full ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.room ? 'border-red-300' : 'border-gray-300'
                                  } ${isMobile ? 'text-base' : 'text-sm'}`}
                                placeholder="พิมพ์ชื่อห้อง"
                                style={{ fontSize: isMobile ? '16px' : '14px' }}
                              />
                            )}
                            {errors.room && (
                              <p className="mt-1 text-xs text-red-600">{errors.room}</p>
                            )}
                            {formData.building && formData.floor !== '' && rooms.length === 0 && !roomsLoading && (
                              <p className="mt-1 text-xs text-gray-500">
                                ไม่พบห้องในฐานข้อมูล กรุณาพิมพ์ชื่อห้อง
                              </p>
                            )}
                          </div>
                        </div>

                        {formData.building && formData.floor !== '' && formData.room && (
                          <div className={`mt-2 p-3 bg-blue-50 rounded-lg`}>
                            <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-blue-800`}>
                              📍 <strong>สถานที่:</strong> {buildings[formData.building].name} {
                                formData.floor === '0' ? 'ใต้ดิน' :
                                  formData.building === '4' && formData.floor === '6' ? 'ดาดฟ้า' :
                                    `ชั้น ${formData.floor}`
                              } {selectedRoomName || formData.room}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                            รายละเอียดสถานที่ <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            name="outdoor_location"
                            value={formData.outdoor_location}
                            onChange={handleInputChange}
                            rows={isMobile ? 2 : 3}
                            className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.outdoor_location ? 'border-red-300' : 'border-gray-300'
                              } ${isMobile ? 'text-base' : 'text-sm'}`}
                            placeholder={isMobile ?
                              "เช่น ลานจอดรถด้านหน้า, สวนหลังอาคาร 3..." :
                              "อธิบายสถานที่ภายนอกอาคารอย่างละเอียด เช่น ลานจอดรถด้านหน้า, สวนหลังอาคาร 3, บริเวณป้ายรถเมล์..."
                            }
                            maxLength={300}
                            style={{ fontSize: isMobile ? '16px' : '14px', resize: isMobile ? 'vertical' : 'both' }}
                          />
                          {errors.outdoor_location && (
                            <p className="mt-1 text-sm text-red-600">{errors.outdoor_location}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            {formData.outdoor_location.length}/300 ตัวอักษร
                          </p>
                        </div>

                        {formData.outdoor_location.trim() && (
                          <div className={`mt-2 p-3 bg-green-50 rounded-lg`}>
                            <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-green-800`}>
                              🌿 <strong>สถานที่:</strong> ภายนอกอาคาร - {formData.outdoor_location.trim()}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    รายละเอียด <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={isMobile ? 3 : 4}
                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                      } ${isMobile ? 'text-base' : 'text-sm'}`}
                    placeholder={isMobile ?
                      "อธิบายปัญหาที่พบอย่างละเอียด..." :
                      "อธิบายปัญหาที่พบอย่างละเอียด เช่น อาการที่เกิดขึ้น, เวลาที่เกิดปัญหา, ได้ลองแก้ไขอย่างไรบ้าง..."
                    }
                    maxLength={1000}
                    style={{ fontSize: isMobile ? '16px' : '14px', resize: isMobile ? 'vertical' : 'both' }}
                    required
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.description.length}/1000 ตัวอักษร
                  </p>
                </div>
              </div>
            </div>
          )}

          {canManageStatus && (
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className={`flex items-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                <Settings className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>จัดการสถานะ</h2>
              </div>

              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
                <div>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    สถานะ
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                    style={{ fontSize: isMobile ? '16px' : '14px' }}
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="assigned">มอบหมายแล้ว</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>

                <div>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    มอบหมายให้
                  </label>
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleInputChange}
                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                    style={{ fontSize: isMobile ? '16px' : '14px' }}
                  >
                    <option value="">ไม่มอบหมาย</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name} ({tech.role})
                      </option>
                    ))}
                  </select>
                </div>

                {formData.status === 'completed' && (
                  <>
                    <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
                      <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                        รายละเอียดการซ่อม <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="completion_details"
                        value={formData.completion_details}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.completion_details ? 'border-red-300' : 'border-gray-300'
                          } ${isMobile ? 'text-base' : 'text-sm'}`}
                        placeholder="อธิบายวิธีการซ่อมและผลลัพธ์..."
                        style={{ fontSize: isMobile ? '16px' : '14px' }}
                        required={formData.status === 'completed'}
                      />
                      {errors.completion_details && (
                        <p className="mt-1 text-sm text-red-600">{errors.completion_details}</p>
                      )}
                    </div>

                    <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
                      <div className="flex items-center mb-4">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
                          รูปภาพงานเสร็จสิ้น
                        </h3>
                        {(currentCompletionImages.length > 0 || completionImagePreviews.length > 0) && (
                          <span className="ml-2 text-sm text-green-600">
                            ({currentCompletionImages.length + completionImagePreviews.length} รูป)
                          </span>
                        )}
                      </div>

                      {currentCompletionImages.length > 0 && (
                        <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                          <h4 className={`${isMobile ? 'text-sm' : 'text-md'} font-medium text-gray-700 mb-3`}>
                            รูปภาพงานเสร็จสิ้นปัจจุบัน ({currentCompletionImages.length} รูป)
                          </h4>
                          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
                            {currentCompletionImages.map((image, index) => (
                              <div key={`completion-current-${index}`} className="relative group">
                                <img
                                  src={image.url}
                                  alt={`Completion ${index + 1}`}
                                  className={`w-full ${isMobile ? 'h-24' : 'h-32'} object-cover rounded-lg border border-green-300`}
                                  onError={handleImageError}
                                  loading="lazy"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCurrentCompletionImage(index)}
                                  className={`absolute top-1 right-1 ${isMobile ? 'p-1 w-6 h-6' : 'p-1.5'} bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full shadow-lg ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                                >
                                  <X className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                                </button>
                                <div className={`absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs max-w-[80%] truncate`}>
                                  {isMobile ? `${index + 1}` : (image.name || 'งานเสร็จสิ้น')}
                                </div>
                                <div className={`absolute top-1 left-1 bg-green-600 text-white px-1 py-0.5 rounded text-xs`}>
                                  เดิม {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {completionImagePreviews.length > 0 && (
                        <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                          <h4 className={`${isMobile ? 'text-sm' : 'text-md'} font-medium text-gray-700 mb-3`}>
                            รูปภาพงานเสร็จสิ้นใหม่ ({completionImagePreviews.length} รูป)
                          </h4>
                          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
                            {completionImagePreviews.map((preview, index) => (
                              <div key={preview.id} className="relative group">
                                <img
                                  src={preview.preview}
                                  alt={`New Completion ${index + 1}`}
                                  className={`w-full ${isMobile ? 'h-24' : 'h-32'} object-cover rounded-lg border border-green-300`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCompletionImage(index)}
                                  className={`absolute top-1 right-1 ${isMobile ? 'p-1 w-6 h-6' : 'p-1.5'} bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full shadow-lg ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                                >
                                  <X className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                                </button>
                                <div className={`absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs max-w-[80%] truncate`}>
                                  {isMobile ? `${index + 1}` : preview.name}
                                </div>
                                <div className={`absolute top-1 left-1 bg-green-600 text-white px-1 py-0.5 rounded text-xs`}>
                                  ใหม่ {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={`border-2 border-dashed border-green-300 rounded-lg ${isMobile ? 'p-4' : 'p-6'} hover:border-green-400 transition-colors bg-green-50`}>
                        <div className="text-center">
                          {isMobile ? (
                            <Camera className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          ) : (
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                          )}

                          <input
                            id="completion-images"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            multiple
                            capture={isMobile ? "environment" : undefined}
                            onChange={handleCompletionImageChange}
                            className="hidden"
                          />

                          <label htmlFor="completion-images" className="cursor-pointer block">
                            <div className={`inline-flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-lg hover:shadow-xl rounded-lg transition-all duration-200 active:scale-95 ${isMobile ? 'w-full text-base font-medium' : 'text-sm'}`}>
                              <Upload className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mr-2`} />
                              {isMobile ? 'ถ่ายรูปงานเสร็จ' : currentCompletionImages.length > 0 || completionImagePreviews.length > 0 ? 'เพิ่มรูปงานเสร็จเพิ่มเติม' : 'เพิ่มรูปภาพงานเสร็จสิ้น'}
                            </div>
                          </label>

                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-2`}>
                            {isMobile ?
                              'อัปโหลดรูปภาพแสดงผลงานที่เสร็จสิ้นแล้ว' :
                              'อัปโหลดรูปภาพแสดงผลงานที่เสร็จสิ้นแล้ว (JPEG, PNG, GIF, WebP ขนาดไม่เกิน 5MB)'
                            }
                          </p>
                          {!isMobile && (
                            <p className="text-xs text-gray-500 mt-1">
                              ช่วยให้ผู้แจ้งเห็นผลการซ่อมแซมอย่างชัดเจน
                            </p>
                          )}
                        </div>
                      </div>

                      {(currentCompletionImages.length > 0 || completionImagePreviews.length > 0) && (
                        <div className="mt-4 text-center">
                          <input
                            id="completion-images-add"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            multiple
                            capture={isMobile ? "environment" : undefined}
                            onChange={handleCompletionImageChange}
                            className="hidden"
                          />
                          <label htmlFor="completion-images-add" className="cursor-pointer">
                            <span className={`text-green-600 hover:text-green-700 ${isMobile ? 'text-sm' : 'text-sm'} inline-flex items-center`}>
                              <Plus className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
                              เพิ่มรูปงานเสร็จอีก
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {canEditDetails && (
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-6'}`}>จัดการรูปภาพ</h2>

              {currentImages.length > 0 && (
                <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                  <h3 className={`${isMobile ? 'text-sm' : 'text-md'} font-medium text-gray-700 mb-3`}>รูปภาพปัจจุบัน ({currentImages.length} รูป)</h3>
                  <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
                    {currentImages.map((image, index) => (
                      <div key={`current-${index}`} className="relative group">
                        <img
                          src={image.url}
                          alt={`Current ${index + 1}`}
                          className={`w-full ${isMobile ? 'h-24' : 'h-32'} object-cover rounded-lg border border-gray-300`}
                          onError={handleImageError}
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => removeCurrentImage(index)}
                          className={`absolute top-1 right-1 ${isMobile ? 'p-1 w-6 h-6' : 'p-1.5'} bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full shadow-lg ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                        >
                          <X className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                        </button>
                        <div className={`absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs max-w-[80%] truncate`}>
                          {isMobile ? `${index + 1}` : (image.name || 'รูปปัจจุบัน')}
                        </div>
                        <div className={`absolute top-1 left-1 bg-green-600 text-white px-1 py-0.5 rounded text-xs`}>
                          เดิม {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imagePreviews.length > 0 && (
                <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`${isMobile ? 'text-sm' : 'text-md'} font-medium text-gray-700`}>
                      รูปภาพใหม่ ({imagePreviews.length} รูป)
                    </h3>
                    <input
                      id="images-add"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      capture={isMobile ? "environment" : undefined}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label htmlFor="images-add" className="cursor-pointer">
                      <span className={`text-blue-600 hover:text-blue-700 ${isMobile ? 'text-sm' : 'text-sm'} inline-flex items-center`}>
                        <Plus className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
                        เพิ่มรูป
                      </span>
                    </label>
                  </div>
                  <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
                    {imagePreviews.map((preview, index) => (
                      <div key={preview.id} className="relative group">
                        <img
                          src={preview.preview}
                          alt={`New ${index + 1}`}
                          className={`w-full ${isMobile ? 'h-24' : 'h-32'} object-cover rounded-lg border border-gray-300`}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className={`absolute top-1 right-1 ${isMobile ? 'p-1 w-6 h-6' : 'p-1.5'} bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full shadow-lg ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                        >
                          <X className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                        </button>
                        <div className={`absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs max-w-[80%] truncate`}>
                          {isMobile ? `${index + 1}` : preview.name}
                        </div>
                        <div className={`absolute top-1 left-1 bg-blue-600 text-white px-1 py-0.5 rounded text-xs`}>
                          ใหม่ {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`border-2 border-dashed border-gray-300 rounded-lg ${isMobile ? 'p-4' : 'p-6'} hover:border-gray-400 transition-colors`}>
                <div className="text-center">
                  {isMobile ? (
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  )}

                  <input
                    id="images"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    multiple
                    capture={isMobile ? "environment" : undefined}
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <label htmlFor="images" className="cursor-pointer block">
                    <div className={`inline-flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl rounded-lg transition-all duration-200 active:scale-95 ${isMobile ? 'w-full text-base font-medium' : 'text-sm'}`}>
                      <Upload className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} mr-2`} />
                      {isMobile ? 'ถ่ายรูป/เลือกรูป' : currentImages.length > 0 || imagePreviews.length > 0 ? 'เพิ่มรูปภาพเพิ่มเติม' : 'เพิ่มรูปภาพ'}
                    </div>
                  </label>

                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-2`}>
                    {isMobile ?
                      'JPEG, PNG, GIF ขนาดไม่เกิน 5MB' :
                      'รองรับไฟล์ JPEG, PNG, GIF, WebP ขนาดไม่เกิน 5MB ต่อไฟล์'
                    }
                  </p>
                  {!isMobile && (
                    <p className="text-xs text-gray-400 mt-1">
                      สามารถเลือกหลายไฟล์พร้อมกัน และเพิ่มรูปได้ไม่จำกัด
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!canEditDetails && currentImages.length > 0 && (
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-6'}`}>รูปภาพประกอบ</h2>

              <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
                {currentImages.map((image, index) => (
                  <div key={`current-${index}`} className="relative group">
                    <img
                      src={image.url}
                      alt={`Current ${index + 1}`}
                      className={`w-full ${isMobile ? 'h-24' : 'h-32'} object-cover rounded-lg border border-gray-300`}
                      onError={handleImageError}
                      loading="lazy"
                    />
                    <div className={`absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs max-w-[80%] truncate`}>
                      {isMobile ? `${index + 1}` : (image.name || 'รูปภาพ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'} ${isMobile ? 'pt-4' : 'pt-6'} border-t border-gray-200`}>
            {!isMobile && (
              <TouchButton
                onClick={() => navigate(`/repairs/${id}`)}
                variant="secondary"
              >
                ยกเลิก
              </TouchButton>
            )}
            <TouchButton
              type="submit"
              disabled={saving}
              variant="primary"
              className={`${isMobile ? 'w-full order-first' : ''}`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isMobile ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกการเปลี่ยนแปลง'}
                </>
              )}
            </TouchButton>
            {isMobile && (
              <TouchButton
                onClick={() => navigate(`/repairs/${id}`)}
                variant="secondary"
                className="w-full"
              >
                ยกเลิก
              </TouchButton>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default RepairEdit;