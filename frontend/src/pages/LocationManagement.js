import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Building,
  Home,
  MapPin,
  Settings,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

const LocationManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buildings, setBuildings] = useState({});
  const [rooms, setRooms] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('buildings'); // buildings, floors, rooms
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');

  // Form states
  const [buildingForm, setBuildingForm] = useState({ id: '', name: '', floors: 1 });
  const [roomForm, setRoomForm] = useState({ id: '', name: '', building: '', floor: '' });
  const [editMode, setEditMode] = useState(false);

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

  // Check admin permission
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('ไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }
    fetchLocationData();
  }, [user, navigate]);

  const TouchButton = ({ onClick, children, className = "", disabled = false, variant = "primary", type = "button" }) => {
    const baseClasses = "relative overflow-hidden transition-all duration-200 active:scale-95 select-none";
    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl",
      secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border border-gray-300",
      danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg hover:shadow-xl",
      ghost: "hover:bg-gray-100 active:bg-gray-200 text-gray-700",
      outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100",
      success: "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-lg hover:shadow-xl"
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

  const fetchLocationData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      // Fetch buildings - ใช้ mock data ก่อนถ้า API ยังไม่พร้อม
      try {
        const buildingsResponse = await axios.get(`${API_BASE_URL}/api/admin/buildings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (buildingsResponse.data.success) {
          const buildingsData = {};
          buildingsResponse.data.data.forEach(building => {
            buildingsData[building.id] = {
              name: building.name,
              floors: building.floors
            };
          });
          setBuildings(buildingsData);
        }
      } catch (buildingError) {
        console.warn('Buildings API not available, using mock data');
        // ใช้ข้อมูล mock ถ้า API ยังไม่พร้อม
        const mockBuildings = {
          1: { name: 'อาคาร 1', floors: 3 },
          2: { name: 'อาคาร 2', floors: 4 },
          3: { name: 'อาคาร 3', floors: 5 },
          4: { name: 'อาคาร 4', floors: 6 },
          5: { name: 'อาคาร 5', floors: 4 }
        };
        setBuildings(mockBuildings);
      }

      // Fetch all rooms - ใช้ mock data ก่อนถ้า API ยังไม่พร้อม
      try {
        const roomsResponse = await axios.get(`${API_BASE_URL}/api/admin/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (roomsResponse.data.success) {
          setRooms(roomsResponse.data.data);
        }
      } catch (roomError) {
        console.warn('Rooms API not available, using mock data');
        // ใช้ข้อมูล mock ถ้า API ยังไม่พร้อม
        const mockRooms = [
          { id: 1, name: 'ห้องประชุม A', building_id: 1, floor: 1 },
          { id: 2, name: 'ห้องประชุม B', building_id: 1, floor: 2 },
          { id: 3, name: 'H301', building_id: 2, floor: 3 },
          { id: 4, name: 'H302', building_id: 2, floor: 3 }
        ];
        setRooms(mockRooms);
      }

    } catch (error) {
      console.error('Error fetching location data:', error);
      if (error.response?.status === 401) {
        toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/login');
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingSubmit = async (e) => {
    e.preventDefault();
    if (!buildingForm.name.trim()) {
      toast.error('กรุณากรอกชื่ออาคาร');
      return;
    }

    if (buildingForm.floors < 1 || buildingForm.floors > 20) {
      toast.error('จำนวนชั้นต้องอยู่ระหว่าง 1-20');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const data = {
        name: buildingForm.name.trim(),
        floors: parseInt(buildingForm.floors)
      };

      if (editMode && buildingForm.id) {
        // Update building
        await axios.put(`${API_BASE_URL}/api/admin/buildings/${buildingForm.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('อัปเดตอาคารสำเร็จ');
      } else {
        // Create building
        await axios.post(`${API_BASE_URL}/api/admin/buildings`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('เพิ่มอาคารสำเร็จ');
      }

      setBuildingForm({ id: '', name: '', floors: 1 });
      setEditMode(false);
      await fetchLocationData();
    } catch (error) {
      console.error('Error saving building:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (!roomForm.name.trim()) {
      toast.error('กรุณากรอกชื่อห้อง');
      return;
    }

    if (!roomForm.building || roomForm.floor === '') {
      toast.error('กรุณาเลือกอาคารและชั้น');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const data = {
        name: roomForm.name.trim(),
        building_id: parseInt(roomForm.building),
        floor: parseInt(roomForm.floor)
      };

      if (editMode && roomForm.id) {
        // Update room
        await axios.put(`${API_BASE_URL}/api/admin/rooms/${roomForm.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('อัปเดตห้องสำเร็จ');
      } else {
        // Create room
        await axios.post(`${API_BASE_URL}/api/admin/rooms`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('เพิ่มห้องสำเร็จ');
      }

      setRoomForm({ id: '', name: '', building: '', floor: '' });
      setEditMode(false);
      await fetchLocationData();
    } catch (error) {
      console.error('Error saving room:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBuilding = async (buildingId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบอาคารนี้? ข้อมูลห้องทั้งหมดในอาคารจะถูกลบด้วย')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/admin/buildings/${buildingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('ลบอาคารสำเร็จ');
      await fetchLocationData();
    } catch (error) {
      console.error('Error deleting building:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบอาคาร';
      toast.error(message);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบห้องนี้?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/admin/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('ลบห้องสำเร็จ');
      await fetchLocationData();
    } catch (error) {
      console.error('Error deleting room:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบห้อง';
      toast.error(message);
    }
  };

  const editBuilding = (buildingId) => {
    const building = buildings[buildingId];
    setBuildingForm({
      id: buildingId,
      name: building.name,
      floors: building.floors
    });
    setEditMode(true);
    setActiveTab('buildings');
  };

  const editRoom = (room) => {
    setRoomForm({
      id: room.id,
      name: room.name,
      building: room.building_id.toString(),
      floor: room.floor.toString()
    });
    setEditMode(true);
    setActiveTab('rooms');
  };

  const cancelEdit = () => {
    setBuildingForm({ id: '', name: '', floors: 1 });
    setRoomForm({ id: '', name: '', building: '', floor: '' });
    setEditMode(false);
  };

  const getFloorsForBuilding = (buildingId) => {
    if (!buildingId || !buildings[buildingId]) return [];

    const floors = [];
    const maxFloors = buildings[buildingId].floors;
    
    // สำหรับอาคาร 4 ที่มีใต้ดิน
    if (buildingId === '4') {
      floors.push({ value: 0, label: 'ใต้ดิน' });
    }
    
    // เพิ่มชั้นปกติ
    for (let i = 1; i <= maxFloors; i++) {
      // สำหรับอาคาร 4 ชั้น 6 คือดาดฟ้า
      if (buildingId === '4' && i === 6) {
        floors.push({ value: i, label: 'ดาดฟ้า' });
      } else {
        floors.push({ value: i, label: `ชั้น ${i}` });
      }
    }
    
    return floors;
  };

  const filteredRooms = selectedBuilding && selectedFloor !== '' 
    ? rooms.filter(room => room.building_id.toString() === selectedBuilding && room.floor.toString() === selectedFloor)
    : selectedBuilding
    ? rooms.filter(room => room.building_id.toString() === selectedBuilding)
    : rooms;

  if (loading) {
    return (
      <Layout title="จัดการสถานที่">
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
    <Layout title="จัดการสถานที่">
      <div className={`space-y-4 sm:space-y-6 ${isMobile ? 'px-0' : ''}`} style={{ paddingBottom: isMobile ? '80px' : '0' }}>
        
        {/* Tab Navigation */}
        <div className={`mb-6`}>
          <div className={`border-b border-gray-200`}>
            <nav className={`flex ${isMobile ? 'space-x-2' : 'space-x-8'}`}>
              <button
                onClick={() => setActiveTab('buildings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'buildings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${isMobile ? 'text-xs px-2' : ''}`}
              >
                <Building className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} inline mr-1`} />
                จัดการอาคาร
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rooms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${isMobile ? 'text-xs px-2' : ''}`}
              >
                <Home className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} inline mr-1`} />
                จัดการห้อง
              </button>
            </nav>
          </div>
        </div>

        {/* Buildings Tab */}
        {activeTab === 'buildings' && (
          <div className="space-y-6">
            {/* Building Form */}
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-4`}>
                {editMode ? 'แก้ไขอาคาร' : 'เพิ่มอาคารใหม่'}
              </h2>
              
              <form onSubmit={handleBuildingSubmit} className={`space-y-4`}>
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      ชื่อ/หมายเลขอาคาร <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={buildingForm.name}
                      onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                      placeholder="เช่น อาคาร 1, Building A"
                      maxLength={50}
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      จำนวนชั้น <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={buildingForm.floors}
                      onChange={(e) => setBuildingForm({ ...buildingForm, floors: parseInt(e.target.value) || 1 })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    />
                  </div>
                </div>
                
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'} pt-4`}>
                  {editMode && (
                    <TouchButton
                      onClick={cancelEdit}
                      variant="secondary"
                      className={`${isMobile ? 'w-full order-2' : ''}`}
                    >
                      ยกเลิก
                    </TouchButton>
                  )}
                  <TouchButton
                    type="submit"
                    disabled={saving}
                    variant="primary"
                    className={`${isMobile ? 'w-full order-1' : ''}`}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        {editMode ? 'อัปเดตอาคาร' : 'เพิ่มอาคาร'}
                      </>
                    )}
                  </TouchButton>
                </div>
              </form>
            </div>

            {/* Buildings List */}
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-4`}>
                รายการอาคาร ({Object.keys(buildings).length} อาคาร)
              </h2>
              
              {Object.keys(buildings).length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">ยังไม่มีอาคารในระบบ</p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
                  {Object.entries(buildings).map(([id, building]) => (
                    <div key={id} className={`border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                            {building.name}
                          </h3>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                            {building.floors} ชั้น
                          </p>
                        </div>
                        <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'space-x-2'}`}>
                          <TouchButton
                            onClick={() => editBuilding(id)}
                            variant="ghost"
                            className={`${isMobile ? 'p-2' : 'p-1'}`}
                          >
                            <Edit3 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          </TouchButton>
                          <TouchButton
                            onClick={() => handleDeleteBuilding(id)}
                            variant="ghost"
                            className={`${isMobile ? 'p-2' : 'p-1'} text-red-600 hover:text-red-700 hover:bg-red-50`}
                          >
                            <Trash2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          </TouchButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            {/* Room Form */}
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-4`}>
                {editMode ? 'แก้ไขห้อง' : 'เพิ่มห้องใหม่'}
              </h2>
              
              <form onSubmit={handleRoomSubmit} className={`space-y-4`}>
                <div>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    ชื่อห้อง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                    placeholder="เช่น ห้องประชุม A, H301"
                    maxLength={100}
                    style={{ fontSize: isMobile ? '16px' : '14px' }}
                    required
                  />
                </div>
                
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      อาคาร <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={roomForm.building}
                      onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value, floor: '' })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    >
                      <option value="">เลือกอาคาร</option>
                      {Object.entries(buildings).map(([id, building]) => (
                        <option key={id} value={id}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      ชั้น <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={roomForm.floor}
                      onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                      disabled={!roomForm.building}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${isMobile ? 'text-base' : 'text-sm'}`}
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    >
                      <option value="">เลือกชั้น</option>
                      {getFloorsForBuilding(roomForm.building).map(floor => (
                        <option key={floor.value} value={floor.value}>
                          {floor.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'} pt-4`}>
                  {editMode && (
                    <TouchButton
                      onClick={cancelEdit}
                      variant="secondary"
                      className={`${isMobile ? 'w-full order-2' : ''}`}
                    >
                      ยกเลิก
                    </TouchButton>
                  )}
                  <TouchButton
                    type="submit"
                    disabled={saving}
                    variant="primary"
                    className={`${isMobile ? 'w-full order-1' : ''}`}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        {editMode ? 'อัปเดตห้อง' : 'เพิ่มห้อง'}
                      </>
                    )}
                  </TouchButton>
                </div>
              </form>
            </div>

            {/* Rooms Filter */}
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-4`}>
                ตัวกรองห้อง
              </h3>
              
              <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
                <div>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    กรองตามอาคาร
                  </label>
                  <select
                    value={selectedBuilding}
                    onChange={(e) => {
                      setSelectedBuilding(e.target.value);
                      setSelectedFloor('');
                    }}
                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                    style={{ fontSize: isMobile ? '16px' : '14px' }}
                  >
                    <option value="">ทุกอาคาร</option>
                    {Object.entries(buildings).map(([id, building]) => (
                      <option key={id} value={id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                    กรองตามชั้น
                  </label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    disabled={!selectedBuilding}
                    className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${isMobile ? 'text-base' : 'text-sm'}`}
                    style={{ fontSize: isMobile ? '16px' : '14px' }}
                  >
                    <option value="">ทุกชั้น</option>
                    {getFloorsForBuilding(selectedBuilding).map(floor => (
                      <option key={floor.value} value={floor.value}>
                        {floor.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {(selectedBuilding || selectedFloor !== '') && (
                <div className="mt-4">
                  <TouchButton
                    onClick={() => {
                      setSelectedBuilding('');
                      setSelectedFloor('');
                    }}
                    variant="secondary"
                    className="text-sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    ล้างตัวกรอง
                  </TouchButton>
                </div>
              )}
            </div>

            {/* Rooms List */}
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
                  รายการห้อง ({filteredRooms.length} ห้อง)
                </h2>
                
                {selectedBuilding && selectedFloor !== '' && (
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                    {buildings[selectedBuilding]?.name} {
                      selectedFloor === '0' ? 'ใต้ดิน' :
                      selectedBuilding === '4' && selectedFloor === '6' ? 'ดาดฟ้า' :
                      `ชั้น ${selectedFloor}`
                    }
                  </div>
                )}
              </div>
              
              {filteredRooms.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {selectedBuilding || selectedFloor !== '' 
                      ? 'ไม่พบห้องตามเงื่อนไขที่เลือก' 
                      : 'ยังไม่มีห้องในระบบ'
                    }
                  </p>
                </div>
              ) : (
                <div className={`space-y-2`}>
                  {filteredRooms.map((room) => (
                    <div key={room.id} className={`border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                              {room.name}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                              ID: {room.id}
                            </span>
                          </div>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {buildings[room.building_id]?.name} {
                              room.floor === 0 ? 'ใต้ดิน' :
                              room.building_id === 4 && room.floor === 6 ? 'ดาดฟ้า' :
                              `ชั้น ${room.floor}`
                            }
                          </p>
                        </div>
                        <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'space-x-2'}`}>
                          <TouchButton
                            onClick={() => editRoom(room)}
                            variant="ghost"
                            className={`${isMobile ? 'p-2' : 'p-1'}`}
                          >
                            <Edit3 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          </TouchButton>
                          <TouchButton
                            onClick={() => handleDeleteRoom(room.id)}
                            variant="ghost"
                            className={`${isMobile ? 'p-2' : 'p-1'} text-red-600 hover:text-red-700 hover:bg-red-50`}
                          >
                            <Trash2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          </TouchButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className={`bg-gradient-to-r from-blue-500 to-blue-600 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'} text-white`}>
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-3`}>สรุปข้อมูลสถานที่</h3>
          <div className={`grid grid-cols-2 ${isMobile ? 'gap-4' : 'md:grid-cols-4 gap-6'}`}>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                {Object.keys(buildings).length}
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>อาคาร</div>
            </div>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                {Object.values(buildings).reduce((sum, building) => sum + building.floors, 0)}
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>ชั้นรวม</div>
            </div>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                {rooms.length}
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>ห้องทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                {new Set(rooms.map(room => `${room.building_id}-${room.floor}`)).size}
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>ชั้นที่มีห้อง</div>
            </div>
          </div>
        </div>

        {/* Help Card */}
        <div className={`bg-yellow-50 border border-yellow-200 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-yellow-800 mb-2`}>
                คำแนะนำการใช้งาน
              </h4>
              <ul className={`${isMobile ? 'text-xs' : 'text-sm'} text-yellow-700 space-y-1`}>
                <li>• เพิ่มอาคารก่อน จากนั้นจึงเพิ่มห้องในอาคารนั้น</li>
                <li>• การลบอาคารจะลบห้องทั้งหมดในอาคารนั้นด้วย</li>
                <li>• สามารถแก้ไขข้อมูลได้โดยคลิกปุ่มแก้ไข</li>
                <li>• ใช้ตัวกรองเพื่อค้นหาห้องตามอาคารและชั้น</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LocationManagement;