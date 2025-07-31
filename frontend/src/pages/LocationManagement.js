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
  AlertCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const LocationManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState({});
  const [isMobile, setIsMobile] = useState(false);


  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [expandedFloors, setExpandedFloors] = useState({});


  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [showFloorForm, setShowFloorForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [buildingForm, setBuildingForm] = useState({ name: '', number: '' });
  const [floorForm, setFloorForm] = useState({ number: '', building: '' });
  const [roomForm, setRoomForm] = useState({ id: '', name: '', building: '', floor: '', description: '' });
  const [editMode, setEditMode] = useState({ type: '', id: null, data: null });


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
    if (!user || user.role !== 'admin') {
      toast.error('ไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }
    fetchRoomsData();
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


  const generateBuildingsFromRooms = (roomsData) => {
    const buildingsMap = {};


    const activeRooms = roomsData.filter(room => room.is_active === 1);

    activeRooms.forEach(room => {
      const buildingNumber = room.building;
      const buildingName = `อาคาร ${buildingNumber}`;

      if (!buildingsMap[buildingNumber]) {
        buildingsMap[buildingNumber] = {
          id: buildingNumber,
          name: buildingName,
          number: buildingNumber,
          floors: room.floor,
          roomCount: 1,
          maxFloor: room.floor,
          minFloor: room.floor
        };
      } else {
        buildingsMap[buildingNumber].floors = Math.max(buildingsMap[buildingNumber].floors, room.floor);
        buildingsMap[buildingNumber].maxFloor = Math.max(buildingsMap[buildingNumber].maxFloor, room.floor);
        buildingsMap[buildingNumber].minFloor = Math.min(buildingsMap[buildingNumber].minFloor, room.floor);
        buildingsMap[buildingNumber].roomCount += 1;
      }
    });

    console.log('🏗️ Buildings generated from', activeRooms.length, 'active rooms:', Object.keys(buildingsMap).length, 'buildings');
    console.log('🏗️ Buildings map:', buildingsMap);

    return buildingsMap;
  };

  const fetchRoomsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      console.log('🔄 Fetching rooms data...');
      const response = await axios.get(`${API_BASE_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📊 Rooms response:', response.data);

      if (response.data.success) {
        const roomsData = response.data.data;
        console.log('✅ Rooms data loaded:', roomsData.length, 'rooms');
        setRooms(roomsData);

        const generatedBuildings = generateBuildingsFromRooms(roomsData);
        console.log('🏢 Generated buildings:', generatedBuildings);
        setBuildings(generatedBuildings);
      } else {
        console.error('❌ Failed to fetch rooms:', response.data.message);
        toast.error(response.data.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }

    } catch (error) {
      console.error('❌ Error fetching rooms data:', error);
      if (error.response?.status === 401) {
        toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/login');
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingSubmit = async (e) => {
    e.preventDefault();
    if (!buildingForm.name.trim() || !buildingForm.number.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const buildingNumber = parseInt(buildingForm.number);
    if (isNaN(buildingNumber) || buildingNumber <= 0) {
      toast.error('กรุณากรอกหมายเลขอาคารที่ถูกต้อง');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Submitting building:', buildingForm.name.trim(), 'Number:', buildingNumber);

      if (editMode.type === 'building') {

        const roomsInBuilding = rooms.filter(room => room.building === editMode.id);
        console.log('🔄 Updating', roomsInBuilding.length, 'rooms in building');


        for (const room of roomsInBuilding) {
          console.log('🔄 Updating room ID:', room.id);
          await axios.put(`${API_BASE_URL}/api/rooms/${room.id}`, {
            name: room.name,
            building: buildingNumber,
            floor: room.floor,
            description: room.description,
            is_active: room.is_active
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        toast.success('อัปเดตอาคารสำเร็จ');
      } else {

        console.log('🔄 Creating new building with sample room');
        const data = {
          name: `ห้องตัวอย่าง`,
          building: buildingNumber,
          floor: 1,
          description: `ห้องตัวอย่างสำหรับ${buildingForm.name.trim()}`,
          is_active: 1
        };

        const response = await axios.post(`${API_BASE_URL}/api/rooms`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Building created:', response.data);
        toast.success('เพิ่มอาคารสำเร็จ');
      }


      setBuildingForm({ name: '', number: '' });
      setEditMode({ type: '', id: null, data: null });
      setShowBuildingForm(false);
      await fetchRoomsData();

    } catch (error) {
      console.error('❌ Error saving building:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFloorSubmit = async (e) => {
    e.preventDefault();
    if (!floorForm.number || !floorForm.building) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }


    const existingFloor = rooms.find(room =>
      room.building === parseInt(floorForm.building) &&
      room.floor === parseInt(floorForm.number)
    );

    if (existingFloor) {
      const buildingName = buildings[floorForm.building]?.name || `อาคาร ${floorForm.building}`;
      toast.error(`ชั้น ${floorForm.number} มีอยู่แล้วใน${buildingName}`);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const buildingName = buildings[floorForm.building]?.name || `อาคาร ${floorForm.building}`;
      console.log('🔄 Creating new floor:', floorForm.number, 'in building:', buildingName);

      const data = {
        name: `ห้องตัวอย่างชั้น ${floorForm.number}`,
        building: parseInt(floorForm.building),
        floor: parseInt(floorForm.number),
        description: `ห้องตัวอย่างสำหรับชั้น ${floorForm.number}`,
        is_active: 1
      };

      const response = await axios.post(`${API_BASE_URL}/api/rooms`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Floor created:', response.data);
      toast.success('เพิ่มชั้นสำเร็จ');
      setFloorForm({ number: '', building: '' });
      setShowFloorForm(false);
      await fetchRoomsData();

    } catch (error) {
      console.error('❌ Error adding floor:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มชั้น';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (!roomForm.name.trim() || !roomForm.building || roomForm.floor === '') {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Submitting room:', roomForm);

      const data = {
        name: roomForm.name.trim(),
        building: parseInt(roomForm.building),
        floor: parseInt(roomForm.floor),
        description: roomForm.description.trim() || '',
        is_active: 1
      };

      if (editMode.type === 'room' && roomForm.id) {
        console.log('🔄 Updating room ID:', roomForm.id);
        const response = await axios.put(`${API_BASE_URL}/api/rooms/${roomForm.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Room updated:', response.data);
        toast.success('อัปเดตห้องสำเร็จ');
      } else {
        console.log('🔄 Creating new room');
        const response = await axios.post(`${API_BASE_URL}/api/rooms`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Room created:', response.data);
        toast.success('เพิ่มห้องสำเร็จ');
      }

      setRoomForm({ id: '', name: '', building: '', floor: '', description: '' });
      setEditMode({ type: '', id: null, data: null });
      setShowRoomForm(false);
      await fetchRoomsData();

    } catch (error) {
      console.error('❌ Error saving room:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBuilding = async (buildingNumber) => {

    const allRoomsInBuilding = rooms.filter(room => room.building === buildingNumber);
    const activeRoomsInBuilding = rooms.filter(room => room.building === buildingNumber && room.is_active !== 0);

    console.log('🔍 Building Number:', buildingNumber);
    console.log('🔍 All rooms in building:', allRoomsInBuilding);
    console.log('🔍 Active rooms in building:', activeRoomsInBuilding);

    if (allRoomsInBuilding.length === 0) {
      console.log('❌ No rooms found in building:', buildingNumber);
      toast.error(`ไม่พบห้องในอาคาร ${buildingNumber}`);
      return;
    }

    const buildingName = buildings[buildingNumber]?.name || `อาคาร ${buildingNumber}`;
    let confirmMessage = `คุณแน่ใจหรือไม่ที่จะลบ${buildingName}?\n\nห้องทั้งหมด ${allRoomsInBuilding.length} ห้อง จะถูกลบด้วย`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Deleting building:', buildingName, 'with', allRoomsInBuilding.length, 'rooms');

      let deletedCount = 0;
      for (const room of allRoomsInBuilding) {
        try {
          console.log('🔄 Deleting room ID:', room.id, 'Name:', room.name);
          const deleteResponse = await axios.delete(`${API_BASE_URL}/api/rooms/${room.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ Room deleted:', deleteResponse.data);
          deletedCount++;
        } catch (roomError) {
          console.error('❌ Failed to delete room:', room.id, roomError.response?.data?.message);
        }
      }

      console.log('✅ Building deleted:', buildingName, `(${deletedCount}/${allRoomsInBuilding.length} rooms deleted)`);
      toast.success(`ลบ${buildingName}สำเร็จ (ลบห้อง ${deletedCount} ห้อง)`);


      setSelectedBuilding('');
      setSelectedFloor('');

      await fetchRoomsData();

    } catch (error) {
      console.error('❌ Error deleting building:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบอาคาร';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFloor = async (buildingNumber, floorNumber) => {
    const roomsInFloor = rooms.filter(room =>
      room.building === buildingNumber &&
      room.floor === floorNumber &&
      room.is_active !== 0
    );

    const buildingName = buildings[buildingNumber]?.name || `อาคาร ${buildingNumber}`;
    console.log('🔍 Floor:', floorNumber, 'in building:', buildingName);
    console.log('🔍 Rooms in floor:', roomsInFloor);

    if (roomsInFloor.length === 0) {
      toast.error(`ไม่พบห้องที่ใช้งานในชั้น ${floorNumber} ของ${buildingName}`);
      return;
    }

    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบชั้น ${floorNumber} ของ${buildingName}? ห้องทั้งหมด ${roomsInFloor.length} ห้อง ในชั้นจะถูกลบด้วย`)) {
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Deleting floor:', floorNumber, 'in building:', buildingName, 'with', roomsInFloor.length, 'rooms');

      for (const room of roomsInFloor) {
        console.log('🔄 Deleting room ID:', room.id, 'Name:', room.name);
        const deleteResponse = await axios.delete(`${API_BASE_URL}/api/rooms/${room.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Room deleted:', deleteResponse.data);
      }

      console.log('✅ Floor deleted:', floorNumber);
      toast.success(`ลบชั้น ${floorNumber} สำเร็จ`);

      await fetchRoomsData();

    } catch (error) {
      console.error('❌ Error deleting floor:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบชั้น';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบห้อง "${room.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Deleting room ID:', roomId);

      await axios.delete(`${API_BASE_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Room deleted:', roomId);
      toast.success('ลบห้องสำเร็จ');
      await fetchRoomsData();

    } catch (error) {
      console.error('❌ Error deleting room:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบห้อง';
      toast.error(message);
    }
  };

  const openBuildingForm = (building = null) => {
    if (building) {
      setBuildingForm({ name: building.name, number: building.number.toString() });
      setEditMode({ type: 'building', id: building.id, data: building });
      console.log('📝 Editing building:', building.name);
    } else {
      setBuildingForm({ name: '', number: '' });
      setEditMode({ type: '', id: null, data: null });
      console.log('📝 Creating new building');
    }
    setShowBuildingForm(true);
  };

  const openFloorForm = (buildingNumber) => {

    const existingFloors = getFloorsForBuilding(buildingNumber);
    const nextFloor = existingFloors.length > 0 ? Math.max(...existingFloors) + 1 : 1;

    setFloorForm({ number: nextFloor.toString(), building: buildingNumber.toString() });
    setShowFloorForm(true);
    console.log('📝 Creating new floor:', nextFloor, 'in building:', buildingNumber);
  };

  const openRoomForm = (room = null, buildingNumber = '', floorNumber = '') => {
    if (room) {
      setRoomForm({
        id: room.id,
        name: room.name,
        building: room.building.toString(),
        floor: room.floor.toString(),
        description: room.description || ''
      });
      setEditMode({ type: 'room', id: room.id, data: room });
      console.log('📝 Editing room:', room.id, room.name);
    } else {
      setRoomForm({
        id: '',
        name: '',
        building: buildingNumber.toString(),
        floor: floorNumber.toString(),
        description: ''
      });
      setEditMode({ type: '', id: null, data: null });
      console.log('📝 Creating new room in building:', buildingNumber, 'floor:', floorNumber);
    }
    setShowRoomForm(true);
  };

  const closeAllForms = () => {
    setShowBuildingForm(false);
    setShowFloorForm(false);
    setShowRoomForm(false);
    setBuildingForm({ name: '', number: '' });
    setFloorForm({ number: '', building: '' });
    setRoomForm({ id: '', name: '', building: '', floor: '', description: '' });
    setEditMode({ type: '', id: null, data: null });
    console.log('📝 All forms closed');
  };

  const toggleFloorExpansion = (buildingNumber, floorNumber) => {
    const key = `${buildingNumber}_${floorNumber}`;
    setExpandedFloors(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    console.log('🔄 Toggle floor expansion:', key);
  };

  const getFloorsForBuilding = (buildingNumber) => {

    const buildingRooms = rooms.filter(room => room.building === buildingNumber);
    const floors = [...new Set(buildingRooms.map(room => room.floor))].sort((a, b) => a - b);
    console.log('🏠 All floors for building', buildingNumber, ':', floors);
    return floors;
  };

  const getRoomsForFloor = (buildingNumber, floorNumber) => {

    const floorRooms = rooms.filter(room =>
      room.building === buildingNumber &&
      room.floor === floorNumber
    );
    console.log('🚪 All rooms for building', buildingNumber, 'floor', floorNumber, ':', floorRooms.length, 'rooms');
    return floorRooms;
  };

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
        { }
        <div className="flex items-center justify-between">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
            จัดการสถานที่
          </h1>
          <TouchButton
            onClick={() => openBuildingForm()}
            variant="primary"
            className={`${isMobile ? 'text-sm' : ''}`}
          >
            <Plus className="w-5 h-5 mr-2" />
            เพิ่มอาคารใหม่
          </TouchButton>
        </div>

        { }
        {!selectedBuilding && (
          <div className="space-y-4">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
              เลือกอาคาร ({Object.keys(buildings).length} อาคาร)
            </h2>

            {Object.keys(buildings).length === 0 ? (
              <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-6' : 'p-8'} text-center`}>
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">ยังไม่มีอาคารในระบบ</p>
                <TouchButton
                  onClick={() => openBuildingForm()}
                  variant="primary"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  เพิ่มอาคารแรก
                </TouchButton>
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
                {Object.entries(buildings).map(([buildingNumber, building]) => {
                  const buildingNum = parseInt(buildingNumber);
                  const buildingRooms = rooms.filter(room => room.building === buildingNum);
                  const activeRooms = buildingRooms.filter(room => room.is_active === 1);
                  const floors = [...new Set(buildingRooms.map(room => room.floor))];

                  return (
                    <div key={buildingNumber} className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'} hover:shadow-lg transition-all duration-200 cursor-pointer group`}>
                      <div
                        onClick={() => {
                          console.log('🏢 Selected building:', building.name, 'Number:', buildingNumber);
                          setSelectedBuilding(buildingNumber);
                        }}
                        className="flex-1"
                      >
                        <div className="flex items-center mb-3">
                          <Building className="w-8 h-8 text-blue-600 mr-3" />
                          <div>
                            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 group-hover:text-blue-600 transition-colors`}>
                              {building.name}
                            </h3>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                              หมายเลขอาคาร: {building.number}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
                            <span className="font-medium">{floors.length}</span> ชั้น
                            {floors.length > 0 && (
                              <> (ชั้น {Math.min(...floors)} - {Math.max(...floors)})</>
                            )}
                          </p>
                          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
                            <span className="font-medium">{activeRooms.length}</span> ห้องใช้งาน / {buildingRooms.length} ห้องทั้งหมด
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                        <TouchButton
                          onClick={(e) => {
                            e.stopPropagation();
                            openBuildingForm(building);
                          }}
                          variant="ghost"
                          className="p-2"
                        >
                          <Edit3 className="w-4 h-4" />
                        </TouchButton>
                        <TouchButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBuilding(buildingNum);
                          }}
                          variant="ghost"
                          disabled={saving}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </TouchButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        { }
        {selectedBuilding && (
          <div className="space-y-4">
            { }
            <div className="flex items-center space-x-2">
              <TouchButton
                onClick={() => {
                  console.log('🔙 Back to buildings list');
                  setSelectedBuilding('');
                  setSelectedFloor('');
                }}
                variant="ghost"
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </TouchButton>
              <span className="text-gray-500">อาคาร</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{buildings[selectedBuilding]?.name}</span>
              {selectedFloor && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">ชั้น {selectedFloor}</span>
                </>
              )}
            </div>

            { }
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                      {buildings[selectedBuilding]?.name}
                    </h2>
                    <p className="text-gray-600">
                      หมายเลขอาคาร: {buildings[selectedBuilding]?.number}
                    </p>
                    <p className="text-gray-600">
                      {getFloorsForBuilding(parseInt(selectedBuilding)).length} ชั้น • {buildings[selectedBuilding]?.roomCount} ห้อง
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TouchButton
                    onClick={() => openBuildingForm(buildings[selectedBuilding])}
                    variant="ghost"
                    className="p-2"
                  >
                    <Edit3 className="w-5 h-5" />
                  </TouchButton>
                  <TouchButton
                    onClick={() => handleDeleteBuilding(parseInt(selectedBuilding))}
                    variant="ghost"
                    disabled={saving}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </TouchButton>
                </div>
              </div>
            </div>

            { }
            <div className={`bg-white shadow-sm border border-gray-100 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
                  รายการชั้น
                </h3>
                <TouchButton
                  onClick={() => openFloorForm(parseInt(selectedBuilding))}
                  variant="primary"
                  className={`${isMobile ? 'text-sm' : ''}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มชั้น
                </TouchButton>
              </div>

              <div className="space-y-3">
                {getFloorsForBuilding(parseInt(selectedBuilding)).length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">ไม่พบชั้นในอาคารนี้</p>
                    <TouchButton
                      onClick={() => openFloorForm(parseInt(selectedBuilding))}
                      variant="primary"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      เพิ่มชั้นแรก
                    </TouchButton>
                  </div>
                ) : (
                  getFloorsForBuilding(parseInt(selectedBuilding)).map((floorNumber) => {
                    const roomsInFloor = getRoomsForFloor(parseInt(selectedBuilding), floorNumber);
                    const isExpanded = expandedFloors[`${selectedBuilding}_${floorNumber}`];

                    return (
                      <div key={floorNumber} className="border border-gray-200 rounded-lg">
                        { }
                        <div className={`${isMobile ? 'p-3' : 'p-4'} flex items-center justify-between hover:bg-gray-50 transition-colors`}>
                          <div
                            className="flex items-center flex-1 cursor-pointer"
                            onClick={() => toggleFloorExpansion(parseInt(selectedBuilding), floorNumber)}
                          >
                            <div className="flex items-center mr-3">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <Home className="w-6 h-6 text-green-600 mr-3" />
                            <div>
                              <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900`}>
                                ชั้น {floorNumber}
                              </h4>
                              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                ทั้งหมด {roomsInFloor.length} ห้อง
                                {roomsInFloor.filter(r => r.is_active === 1).length !== roomsInFloor.length && (
                                  <> • ใช้งาน {roomsInFloor.filter(r => r.is_active === 1).length} ห้อง</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TouchButton
                              onClick={(e) => {
                                e.stopPropagation();
                                openRoomForm(null, parseInt(selectedBuilding), floorNumber);
                              }}
                              variant="ghost"
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Plus className="w-4 h-4" />
                            </TouchButton>
                            <TouchButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFloor(parseInt(selectedBuilding), floorNumber);
                              }}
                              variant="ghost"
                              disabled={saving}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </TouchButton>
                          </div>
                        </div>

                        { }
                        {isExpanded && (
                          <div className={`border-t border-gray-200 ${isMobile ? 'p-3' : 'p-4'} bg-gray-50`}>
                            <div className="space-y-2">
                              {roomsInFloor.map((room) => (
                                <div key={room.id} className={`bg-white border border-gray-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'} hover:shadow-sm transition-shadow ${room.is_active === 0 ? 'opacity-60' : ''}`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-1">
                                      <MapPin className={`w-5 h-5 ${room.is_active === 0 ? 'text-gray-400' : 'text-blue-600'} mr-3`} />
                                      <div>
                                        <div className="flex items-center space-x-2">
                                          <h5 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium ${room.is_active === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
                                            {room.name}
                                          </h5>
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                                            อาคาร {room.building} ชั้น {room.floor}
                                          </span>
                                        </div>
                                        {room.description && (
                                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>
                                            {room.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <TouchButton
                                        onClick={() => openRoomForm(room)}
                                        variant="ghost"
                                        className="p-2"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </TouchButton>
                                      <TouchButton
                                        onClick={() => handleDeleteRoom(room.id)}
                                        variant="ghost"
                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </TouchButton>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              { }
                              <TouchButton
                                onClick={() => openRoomForm(null, parseInt(selectedBuilding), floorNumber)}
                                variant="outline"
                                className="w-full justify-center py-3 border-dashed border-2"
                              >
                                <Plus className="w-5 h-5 mr-2" />
                                เพิ่มห้องในชั้นนี้
                              </TouchButton>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        { }
        {showBuildingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white ${isMobile ? 'rounded-lg w-full max-w-sm' : 'rounded-xl w-full max-w-md'} max-h-[90vh] overflow-y-auto`}>
              <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
                    {editMode.type === 'building' ? 'แก้ไขอาคาร' : 'เพิ่มอาคารใหม่'}
                  </h3>
                  <TouchButton
                    onClick={closeAllForms}
                    variant="ghost"
                    className="p-2"
                  >
                    <X className="w-5 h-5" />
                  </TouchButton>
                </div>

                <form onSubmit={handleBuildingSubmit} className="space-y-4">
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      หมายเลขอาคาร <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={buildingForm.number}
                      onChange={(e) => setBuildingForm({ ...buildingForm, number: e.target.value })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                      placeholder="เช่น 1, 2, 3"
                      min="1"
                      max="999"
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      ชื่อเรียกอาคาร <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={buildingForm.name}
                      onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                      placeholder="เช่น อาคาร 1, Building A, อาคารเรียนรวม"
                      maxLength={100}
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    />
                  </div>

                  <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'} pt-4`}>
                    <TouchButton
                      onClick={closeAllForms}
                      variant="secondary"
                      className={`${isMobile ? 'w-full order-2' : ''}`}
                    >
                      ยกเลิก
                    </TouchButton>
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
                          {editMode.type === 'building' ? 'อัปเดตอาคาร' : 'เพิ่มอาคาร'}
                        </>
                      )}
                    </TouchButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        { }
        {showFloorForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white ${isMobile ? 'rounded-lg w-full max-w-sm' : 'rounded-xl w-full max-w-md'} max-h-[90vh] overflow-y-auto`}>
              <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
                    เพิ่มชั้นใหม่
                  </h3>
                  <TouchButton
                    onClick={closeAllForms}
                    variant="ghost"
                    className="p-2"
                  >
                    <X className="w-5 h-5" />
                  </TouchButton>
                </div>

                <form onSubmit={handleFloorSubmit} className="space-y-4">
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      อาคาร
                    </label>
                    <input
                      type="text"
                      value={buildings[floorForm.building]?.name || ''}
                      disabled
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg bg-gray-100 ${isMobile ? 'text-base' : 'text-sm'}`}
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                    />
                  </div>

                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      หมายเลขชั้น <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={floorForm.number}
                      onChange={(e) => setFloorForm({ ...floorForm, number: e.target.value })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                      placeholder="เช่น 1, 2, 3 (ใส่ 0 สำหรับใต้ดิน)"
                      min="0"
                      max="50"
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    />
                  </div>

                  <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'} pt-4`}>
                    <TouchButton
                      onClick={closeAllForms}
                      variant="secondary"
                      className={`${isMobile ? 'w-full order-2' : ''}`}
                    >
                      ยกเลิก
                    </TouchButton>
                    <TouchButton
                      type="submit"
                      disabled={saving}
                      variant="primary"
                      className={`${isMobile ? 'w-full order-1' : ''}`}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          กำลังเพิ่ม...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          เพิ่มชั้น
                        </>
                      )}
                    </TouchButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        { }
        {showRoomForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white ${isMobile ? 'rounded-lg w-full max-w-sm' : 'rounded-xl w-full max-w-md'} max-h-[90vh] overflow-y-auto`}>
              <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
                    {editMode.type === 'room' ? 'แก้ไขห้อง' : 'เพิ่มห้องใหม่'}
                  </h3>
                  <TouchButton
                    onClick={closeAllForms}
                    variant="ghost"
                    className="p-2"
                  >
                    <X className="w-5 h-5" />
                  </TouchButton>
                </div>

                <form onSubmit={handleRoomSubmit} className="space-y-4">
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      ชื่อห้อง <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={roomForm.name}
                      onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                      placeholder="เช่น ห้องประชุม A, H301, ห้องปฏิบัติการ"
                      maxLength={200}
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      อาคาร <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={roomForm.building}
                      onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    >
                      <option value="">เลือกอาคาร</option>
                      {Object.entries(buildings).map(([buildingNumber, building]) => (
                        <option key={buildingNumber} value={buildingNumber}>
                          {building.name} (หมายเลข {buildingNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      ชั้น <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={roomForm.floor}
                      onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'}`}
                      placeholder="หมายเลขชั้น (ใส่ 0 สำหรับใต้ดิน)"
                      min="0"
                      max="50"
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      รายละเอียด
                    </label>
                    <textarea
                      value={roomForm.description}
                      onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                      className={`w-full ${isMobile ? 'px-3 py-3' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'text-base' : 'text-sm'} resize-none`}
                      placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับห้อง (ไม่บังคับ)"
                      rows="3"
                      maxLength={500}
                      style={{ fontSize: isMobile ? '16px' : '14px' }}
                    />
                  </div>

                  <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'} pt-4`}>
                    <TouchButton
                      onClick={closeAllForms}
                      variant="secondary"
                      className={`${isMobile ? 'w-full order-2' : ''}`}
                    >
                      ยกเลิก
                    </TouchButton>
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
                          {editMode.type === 'room' ? 'อัปเดตห้อง' : 'เพิ่มห้อง'}
                        </>
                      )}
                    </TouchButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        { }
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
                {[...new Set(rooms.map(room => `${room.building}_${room.floor}`))].length}
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
                {rooms.filter(room => room.is_active === 1).length}
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>ห้องที่ใช้งาน</div>
            </div>
          </div>
        </div>

        { }
        <div className={`bg-yellow-50 border border-yellow-200 ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-yellow-800 mb-2`}>
                คำแนะนำการใช้งาน (ใช้ข้อมูลจาก Rooms Table เท่านั้น)
              </h4>
              <ul className={`${isMobile ? 'text-xs' : 'text-sm'} text-yellow-700 space-y-1`}>
                <li>• ข้อมูลอาคารสร้างจากฟิลด์ `building` ในตาราง rooms</li>
                <li>• ชื่อห้องแสดงจากฟิลด์ `name` พร้อมข้อมูลอาคารและชั้น</li>
                <li>• คลิกที่อาคารเพื่อดูรายละเอียดชั้นและห้อง</li>
                <li>• การเพิ่มอาคารจะสร้างห้องตัวอย่างในฐานข้อมูล</li>
                <li>• การลบอาคารจะลบห้องทั้งหมดในอาคารนั้น</li>
                <li>• หมายเลขอาคารต้องเป็นตัวเลขเท่านั้น (1, 2, 3, ...)</li>
                <li>• รองรับชั้นใต้ดิน (ชั้น 0)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LocationManagement;