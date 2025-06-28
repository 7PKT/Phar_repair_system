import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { ArrowLeft, Upload, X, Image as ImageIcon, Save, Plus, Camera } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RepairForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

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

    // ข้อมูลอาคารและชั้น (อัปเดตตามข้อมูลใหม่)
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
        priority: 'medium'
    });

    const [errors, setErrors] = useState({});

    // Touch-friendly button component
    const TouchButton = ({ onClick, children, className = "", disabled = false, variant = "primary", type = "button" }) => {
        const baseClasses = "relative overflow-hidden transition-all duration-200 active:scale-95 select-none";
        const variantClasses = {
            primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl",
            secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border border-gray-300",
            danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg hover:shadow-xl",
            ghost: "hover:bg-gray-100 active:bg-gray-200 text-gray-700"
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
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('ไม่พบ token การเข้าสู่ระบบ');
                navigate('/login');
                return;
            }

            const response = await axios.get('/api/repairs/categories', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Categories response:', response.data);

            // รองรับหลายรูปแบบของ response
            let categoriesData = [];
            if (Array.isArray(response.data)) {
                categoriesData = response.data;
            } else if (response.data.categories && Array.isArray(response.data.categories)) {
                categoriesData = response.data.categories;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                categoriesData = response.data.data;
            }

            setCategories(categoriesData);

            // ถ้าไม่มี categories ให้สร้าง default categories
            if (categoriesData.length === 0) {
                console.warn('No categories found, using default categories');
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
            console.error('Error fetching categories:', error);
            
            // แสดง error message ที่เฉพาะเจาะจง
            if (error.response?.status === 401) {
                toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
                navigate('/login');
            } else if (error.response?.status === 403) {
                toast.error('ไม่มีสิทธิ์เข้าถึงข้อมูลหมวดหมู่');
            } else {
                toast.error('เกิดข้อผิดพลาดในการโหลดหมวดหมู่');
            }
            
            // ใช้ default categories เมื่อเกิด error
            const defaultCategories = [
                { id: 1, name: 'คอมพิวเตอร์' },
                { id: 2, name: 'เครือข่าย' },
                { id: 3, name: 'ไฟฟ้า' },
                { id: 4, name: 'ประปา' },
                { id: 5, name: 'แอร์' },
                { id: 6, name: 'อื่นๆ' }
            ];
            setCategories(defaultCategories);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

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

        if (!formData.building) {
            newErrors.building = 'กรุณาเลือกอาคาร';
        }

        if (!formData.floor) {
            newErrors.floor = 'กรุณาเลือกชั้น';
        }

        if (!formData.room.trim()) {
            newErrors.room = 'กรุณากรอกห้อง';
        }

        if (!formData.priority) {
            newErrors.priority = 'กรุณาเลือกระดับความสำคัญ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // ถ้าเปลี่ยนอาคาร ให้รีเซ็ตชั้น
        if (name === 'building') {
            setFormData({
                ...formData,
                [name]: value,
                floor: '' // รีเซ็ตชั้นเมื่อเปลี่ยนอาคาร
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }

        // ลบ error message เมื่อผู้ใช้แก้ไข
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    // ปรับปรุงฟังก์ชัน handleImageChange
    const handleImageChange = (event) => {
        const files = Array.from(event.target.files);
        
        if (files.length === 0) return;

        console.log('Selected files:', files);

        const validFiles = [];
        const newPreviews = []; // ย้ายมาไว้ด้านบน
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        let processedCount = 0;
        const totalFiles = files.length;

        // ฟังก์ชันสำหรับอัปเดต state หลังจากประมวลผลครบ
        const updateImageState = () => {
            if (validFiles.length > 0) {
                setSelectedImages(prev => {
                    const updatedImages = [...prev, ...validFiles];
                    console.log('Updated selectedImages:', updatedImages);
                    return updatedImages;
                });
                
                setImagePreviews(prev => {
                    const updatedPreviews = [...prev, ...newPreviews];
                    console.log('Updated imagePreviews:', updatedPreviews);
                    return updatedPreviews;
                });
                
                toast.success(`เพิ่มรูปภาพสำเร็จ ${validFiles.length} ไฟล์`);
            }
        };

        // ประมวลผลแต่ละไฟล์
        files.forEach((file, index) => {
            console.log(`Processing file ${index + 1}:`, file.name, file.size, file.type);

            // ตรวจสอบขนาดไฟล์
            if (file.size > maxFileSize) {
                toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 5MB)`);
                processedCount++;
                if (processedCount === totalFiles && validFiles.length > 0) {
                    updateImageState();
                }
                return;
            }

            // ตรวจสอบชนิดไฟล์
            if (!allowedTypes.includes(file.type)) {
                toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`);
                processedCount++;
                if (processedCount === totalFiles && validFiles.length > 0) {
                    updateImageState();
                }
                return;
            }

            // ไฟล์ผ่านการตรวจสอบ
            validFiles.push(file);

            // สร้าง preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewData = {
                    id: Date.now() + Math.random() + index,
                    file: file,
                    preview: e.target.result,
                    name: file.name
                };
                
                newPreviews.push(previewData);
                console.log(`Preview created for ${file.name}:`, previewData);

                processedCount++;
                
                // เมื่อประมวลผลครบทุกไฟล์
                if (processedCount === totalFiles) {
                    console.log('All files processed, updating state...');
                    updateImageState();
                }
            };

            reader.onerror = (error) => {
                console.error(`Error reading file ${file.name}:`, error);
                toast.error(`เกิดข้อผิดพลาดในการอ่านไฟล์ ${file.name}`);
                processedCount++;
                if (processedCount === totalFiles && validFiles.length > 0) {
                    updateImageState();
                }
            };

            reader.readAsDataURL(file);
        });

        // รีเซ็ต input หลังจากเลือกไฟล์
        event.target.value = '';
    };

    // ปรับปรุงฟังก์ชัน removeImage
    const removeImage = (index) => {
        console.log('Removing image at index:', index);
        
        setSelectedImages(prev => {
            const newImages = prev.filter((_, i) => i !== index);
            console.log('Updated selectedImages after removal:', newImages);
            return newImages;
        });
        
        setImagePreviews(prev => {
            const newPreviews = prev.filter((_, i) => i !== index);
            console.log('Updated imagePreviews after removal:', newPreviews);
            return newPreviews;
        });
        
        toast.info('ลบรูปภาพแล้ว');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
            return;
        }

        setLoading(true);

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
            
            // รวมสถานที่เป็น location string
            const location = `${buildings[formData.building].name} ชั้น ${formData.floor} ห้อง ${formData.room.trim()}`;
            submitData.append('location', location);
            submitData.append('priority', formData.priority);

            // เพิ่มรูปภาพทั้งหมด
            selectedImages.forEach((image, index) => {
                submitData.append(`images`, image); // ใช้ชื่อ field เดียวกันสำหรับหลายไฟล์
            });

            console.log('Submitting repair data with', selectedImages.length, 'images');

            const response = await axios.post('/api/repairs', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
            });

            console.log('Repair created successfully:', response.data);
            
            toast.success('แจ้งซ่อมสำเร็จ! 🎉', {
                duration: 3000
            });

            // นำทางไปหน้ารายละเอียด หรือรายการแจ้งซ่อม
            if (response.data.repair && response.data.repair.id) {
                navigate(`/repairs/${response.data.repair.id}`);
            } else if (response.data.id) {
                navigate(`/repairs/${response.data.id}`);
            } else {
                navigate('/repairs');
            }
        } catch (error) {
            console.error('Submit error:', error);
            
            // แสดง error message ที่เฉพาะเจาะจง
            if (error.response?.status === 401) {
                toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
                navigate('/login');
            } else if (error.response?.status === 403) {
                toast.error('ไม่มีสิทธิ์สร้างการแจ้งซ่อม');
            } else if (error.response?.status === 422) {
                // Validation errors from server
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
                const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการแจ้งซ่อม';
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
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

    const headerContent = (
        <button
            onClick={() => navigate(-1)}
            className="p-3 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
            style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '48px',
                minWidth: '48px'
            }}
        >
            <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
    );

    if (categoriesLoading) {
        return (
            <Layout title="แจ้งซ่อมใหม่">
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
        <Layout title="แจ้งซ่อมใหม่" headerContent={headerContent}>
            <div className={`mx-auto ${isMobile ? 'px-0' : 'max-w-2xl'}`} style={{ paddingBottom: isMobile ? '80px' : '0' }}>
                <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
                    <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
                            กรอกรายละเอียดการแจ้งซ่อม
                        </h2>
                        <p className={`text-gray-600 mt-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                            {isMobile ? 'กรอกข้อมูลให้ครบถ้วน' : 'กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้เราสามารถดำเนินการได้อย่างรวดเร็ว'}
                        </p>
                        
                        {/* Debug info - แสดงจำนวนรูปภาพที่เลือก */}
                        {selectedImages.length > 0 && (
                            <div className="mt-2 text-sm text-blue-600">
                                🖼️ เลือกรูปภาพแล้ว: {selectedImages.length} รูป
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className={`space-y-${isMobile ? '4' : '6'}`}>
                        {/* Title */}
                        <div>
                            <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                                หัวข้อ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.title ? 'border-red-300' : 'border-gray-300'
                                } ${isMobile ? 'text-base' : 'text-sm'}`}
                                placeholder="เช่น ไฟดับในห้องประชุม, คอมพิวเตอร์เปิดไม่ติด"
                                maxLength={200}
                                style={{ fontSize: isMobile ? '16px' : '14px' }} // Prevent zoom on iOS
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                {formData.title.length}/200 ตัวอักษร
                            </p>
                        </div>

                        {/* Category and Priority */}
                        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
                            {/* Category */}
                            <div>
                                <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                                    หมวดหมู่ <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.category_id ? 'border-red-300' : 'border-gray-300'
                                    } ${isMobile ? 'text-base' : 'text-sm'}`}
                                    style={{ fontSize: isMobile ? '16px' : '14px' }}
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

                            {/* Priority */}
                            <div>
                                <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                                    ระดับความสำคัญ <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.priority ? 'border-red-300' : 'border-gray-300'
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
                        </div>

                        {/* Location Selection */}
                        <div className="space-y-4">
                            <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700`}>
                                สถานที่ <span className="text-red-500">*</span>
                            </label>
                            
                            <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-3 gap-4'}`}>
                                {/* Building */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        อาคาร
                                    </label>
                                    <select
                                        name="building"
                                        value={formData.building}
                                        onChange={handleInputChange}
                                        className={`w-full ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.building ? 'border-red-300' : 'border-gray-300'
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
                                        className={`w-full ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                            errors.floor ? 'border-red-300' : 'border-gray-300'
                                        } ${isMobile ? 'text-base' : 'text-sm'}`}
                                        style={{ fontSize: isMobile ? '16px' : '14px' }}
                                    >
                                        <option value="">เลือกชั้น</option>
                                        {getFloorsForBuilding(formData.building).map(floor => (
                                            <option key={floor} value={floor}>
                                                ชั้น {floor}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.floor && (
                                        <p className="mt-1 text-xs text-red-600">{errors.floor}</p>
                                    )}
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
                                        className={`w-full ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.room ? 'border-red-300' : 'border-gray-300'
                                        } ${isMobile ? 'text-base' : 'text-sm'}`}
                                        placeholder="เช่น 101, ห้องประชุม"
                                        style={{ fontSize: isMobile ? '16px' : '14px' }}
                                    />
                                    {errors.room && (
                                        <p className="mt-1 text-xs text-red-600">{errors.room}</p>
                                    )}
                                </div>
                            </div>

                            {/* Location Preview */}
                            {formData.building && formData.floor && formData.room && (
                                <div className={`mt-2 p-3 bg-blue-50 rounded-lg`}>
                                    <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-blue-800`}>
                                        📍 <strong>สถานที่:</strong> {buildings[formData.building].name} ชั้น {formData.floor} ห้อง {formData.room}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                                รายละเอียด <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={isMobile ? 3 : 4}
                                className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.description ? 'border-red-300' : 'border-gray-300'
                                } ${isMobile ? 'text-base' : 'text-sm'}`}
                                placeholder={isMobile ? 
                                    "อธิบายปัญหาที่พบอย่างละเอียด..." : 
                                    "อธิบายปัญหาที่พบอย่างละเอียด เช่น อาการที่เกิดขึ้น, เวลาที่เกิดปัญหา, ได้ลองแก้ไขอย่างไรบ้าง..."
                                }
                                maxLength={1000}
                                style={{ fontSize: isMobile ? '16px' : '14px', resize: isMobile ? 'vertical' : 'both' }}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                {formData.description.length}/1000 ตัวอักษร
                            </p>
                        </div>

                        {/* ปรับปรุงส่วน Image Upload */}
                        <div>
                            <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                                รูปภาพประกอบ {isMobile ? '' : '(ไม่จำกัดจำนวน)'}
                            </label>

                            {/* Upload Area - ปรับปรุงให้ทำงานได้ดีขึ้น */}
                            <div className={`border-2 border-dashed border-gray-300 rounded-lg ${isMobile ? 'p-4' : 'p-6'} hover:border-gray-400 transition-colors`}>
                                <div className="text-center">
                                    {isMobile ? (
                                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    ) : (
                                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    )}
                                    
                                    {/* ปรับปรุง input file */}
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
                                            {isMobile ? 'ถ่ายรูป/เลือกรูป' : 'เพิ่มรูปภาพ'}
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

                            {/* Image Previews - ปรับปรุงการแสดงผล */}
                            {imagePreviews.length > 0 && (
                                <div className={`mt-4`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700`}>
                                            รูปภาพที่เลือก ({imagePreviews.length} รูป)
                                        </p>
                                        
                                        {/* ปุ่มเพิ่มรูปเพิ่มเติม */}
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
                                                    alt={`Preview ${index + 1}`}
                                                    className={`w-full ${isMobile ? 'h-24' : 'h-32'} object-cover rounded-lg border border-gray-300`}
                                                />
                                                
                                                {/* ปุ่มลบ */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className={`absolute top-1 right-1 ${isMobile ? 'p-1 w-6 h-6' : 'p-1.5'} bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full shadow-lg ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                                                >
                                                    <X className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                                                </button>
                                                
                                                {/* ชื่อไฟล์/หมายเลข */}
                                                <div className={`absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs max-w-[80%] truncate`}>
                                                    {isMobile ? `${index + 1}` : preview.name}
                                                </div>
                                                
                                                {/* หมายเลขลำดับ */}
                                                <div className={`absolute top-1 left-1 bg-blue-600 text-white px-1 py-0.5 rounded text-xs`}>
                                                    {index + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons - Mobile Optimized */}
                        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'} ${isMobile ? 'pt-4' : 'pt-6'} border-t border-gray-200`}>
                            {!isMobile && (
                                <TouchButton
                                    onClick={() => navigate(-1)}
                                    variant="secondary"
                                >
                                    ยกเลิก
                                </TouchButton>
                            )}
                            <TouchButton
                                type="submit"
                                disabled={loading}
                                variant="primary"
                                className={`${isMobile ? 'w-full order-first' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        {isMobile ? 'บันทึกการแจ้งซ่อม' : 'บันทึกการแจ้งซ่อม'}
                                    </>
                                )}
                            </TouchButton>
                            {isMobile && (
                                <TouchButton
                                    onClick={() => navigate(-1)}
                                    variant="secondary"
                                    className="w-full"
                                >
                                    ยกเลิก
                                </TouchButton>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default RepairForm;