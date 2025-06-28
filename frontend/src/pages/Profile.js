import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Shield,
  Save,
  ArrowLeft,
  Calendar,
  Phone,
  Key,
  Edit,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    username: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const userData = response.data;
      setCurrentUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        username: userData.username || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/auth/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('อัพเดทข้อมูลสำเร็จ! 🎉');
      await fetchUserProfile();
    } catch (error) {
      console.error('Update profile error:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดท';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword) {
      toast.error('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }

    if (!passwordData.newPassword) {
      toast.error('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('รหัสผ่านใหม่ต้องไม่เหมือนกับรหัสผ่านปัจจุบัน');
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('เปลี่ยนรหัสผ่านสำเร็จ! 🎉');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });

    } catch (error) {
      console.error('Change password error:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
      
      if (error.response?.status === 400) {
        toast.error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      } else if (error.response?.status === 401) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        logout();
      } else {
        toast.error(message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleText = (role) => {
    const roleMap = {
      'admin': 'ผู้ดูแลระบบ',
      'technician': 'ช่างซ่อม',
      'user': 'ผู้ใช้งาน'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colorMap = {
      'admin': 'bg-red-100 text-red-800 border-red-200',
      'technician': 'bg-blue-100 text-blue-800 border-blue-200',
      'user': 'bg-green-100 text-green-800 border-green-200'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const displayUser = currentUser || user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                กลับ
              </button>
              <h1 className="text-xl font-bold text-blue-600">ข้อมูลส่วนตัว</h1>
            </div>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {displayUser?.full_name?.charAt(0) || displayUser?.username?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {displayUser?.full_name || 'ไม่ระบุชื่อ'}
                </h1>
                <p className="text-gray-600 mb-2">@{displayUser?.username}</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(displayUser?.role)}`}>
                    <Shield className="w-4 h-4 mr-1" />
                    {getRoleText(displayUser?.role)}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center mb-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  สมัครเมื่อ: {displayUser?.created_at ? new Date(displayUser.created_at).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  อัพเดท: {displayUser?.updated_at ? new Date(displayUser.updated_at).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Profile Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <Edit className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">แก้ไขข้อมูลส่วนตัว</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="กรอกชื่อ-นามสกุล"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0xx-xxx-xxxx"
                  />
                </div>

                {/* Username - สำหรับ admin/technician */}
                {displayUser?.role !== 'user' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      ชื่อผู้ใช้
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Information - Read Only */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">ข้อมูลบัญชี</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{displayUser?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้</label>
                <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900 font-mono">{displayUser?.username}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
                <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg">
                  <Shield className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{getRoleText(displayUser?.role)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะบัญชี</label>
                <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg">
                  <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
                  <span className="text-gray-900">ใช้งานได้</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <Key className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">ความปลอดภัย</h2>
            </div>
            
            <div className="space-y-4">
              {!showPasswordForm ? (
                <button 
                  onClick={() => setShowPasswordForm(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <Key className="w-4 h-4 mr-2" />
                  เปลี่ยนรหัสผ่าน
                </button>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">เปลี่ยนรหัสผ่าน</h3>
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                        setShowPasswords({
                          current: false,
                          new: false,
                          confirm: false
                        });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสผ่านปัจจุบัน <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="กรอกรหัสผ่านปัจจุบัน"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสผ่านใหม่ <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                          required
                          minLength="6"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {passwordLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Key className="w-4 h-4 mr-2" />
                        )}
                        {passwordLoading ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  🔒 <strong>เคล็ดลับความปลอดภัย:</strong> เปลี่ยนรหัสผ่านเป็นประจำ ใช้รหัสผ่านที่แข็งแกรง (อย่างน้อย 6 ตัวอักษร ผสมตัวเลขและอักษรพิเศษ) และไม่แชร์ข้อมูลการเข้าสู่ระบบกับผู้อื่น
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;