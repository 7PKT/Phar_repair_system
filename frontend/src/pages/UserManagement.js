import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Users,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Shield,
    User,
    Mail,
    Phone,
    Calendar,
    Settings,
    RefreshCw,
    Download,
    Upload,
    Eye,
    EyeOff,
    X,
    Check,
    AlertCircle,
    UserCheck,
    UserX,
    Crown,
    Wrench,
    UserPlus,
    Save,
    FileSpreadsheet,
    SortAsc,
    SortDesc,
    Menu,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Form data for create/edit
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        phone: '',
        role: 'user',
        password: '',
        confirmPassword: '',
        notification_enabled: true
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        // ตรวจสอบสิทธิ์ - เฉพาะ admin เท่านั้น
        if (user?.role !== 'admin') {
            toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
            return;
        }
        fetchUsers();
    }, [user]);

    const fetchUsers = useCallback(async () => {
        try {
            if (!refreshing) setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('ไม่พบ token การเข้าสู่ระบบ');
                return;
            }

            const response = await axios.get('/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);

            if (error.response?.status === 401) {
                toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
            } else if (error.response?.status === 403) {
                toast.error('ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้');
            } else {
                toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
            }
            setUsers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setRoleFilter('all');
        setStatusFilter('all');
        setCurrentPage(1);
        setShowMobileFilters(false);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            full_name: '',
            phone: '',
            role: 'user',
            password: '',
            confirmPassword: '',
            notification_enabled: true
        });
        setFormErrors({});
    };

    const validateForm = (isEdit = false) => {
        const errors = {};

        if (!formData.username.trim()) {
            errors.username = 'กรุณากรอกชื่อผู้ใช้';
        } else if (formData.username.length < 3) {
            errors.username = 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร';
        }

        if (!formData.email.trim()) {
            errors.email = 'กรุณากรอกอีเมล';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
        }

        if (!formData.full_name.trim()) {
            errors.full_name = 'กรุณากรอกชื่อ-นามสกุล';
        }

        if (!isEdit) {
            if (!formData.password) {
                errors.password = 'กรุณากรอกรหัสผ่าน';
            } else if (formData.password.length < 6) {
                errors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
            }

            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
            }
        } else if (formData.password && formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const submitData = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim(),
                role: formData.role,
                password: formData.password,
                notification_enabled: formData.notification_enabled
            };

            await axios.post('/api/admin/users', submitData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success('สร้างผู้ใช้สำเร็จ! 🎉');
            setShowCreateModal(false);
            resetForm();
            await fetchUsers();
        } catch (error) {
            console.error('Create user error:', error);
            const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้';
            toast.error(message);
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();

        if (!validateForm(true)) {
            toast.error('กรุณาตรวจสอบข้อมูลที่กรอก');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const submitData = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim(),
                role: formData.role,
                notification_enabled: formData.notification_enabled
            };

            // เพิ่มรหัสผ่านถ้ามีการระบุ
            if (formData.password) {
                submitData.password = formData.password;
            }

            await axios.put(`/api/admin/users/${selectedUser.id}`, submitData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success('อัพเดทผู้ใช้สำเร็จ! 🎉');
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
            await fetchUsers();
        } catch (error) {
            console.error('Update user error:', error);
            const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดทผู้ใช้';
            toast.error(message);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/admin/users/${selectedUser.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success('ลบผู้ใช้สำเร็จ');
            setShowDeleteModal(false);
            setSelectedUser(null);
            await fetchUsers();
        } catch (error) {
            console.error('Delete user error:', error);
            const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้';
            toast.error(message);
        }
    };

    const openEditModal = (userData) => {
        setSelectedUser(userData);
        setFormData({
            username: userData.username || '',
            email: userData.email || '',
            full_name: userData.full_name || '',
            phone: userData.phone || '',
            role: userData.role || 'user',
            password: '',
            confirmPassword: '',
            notification_enabled: userData.notification_enabled ?? true
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (userData) => {
        setSelectedUser(userData);
        setShowDeleteModal(true);
    };

    const exportToExcel = () => {
        try {
            const exportData = filteredAndSortedUsers;

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Tahoma', sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
        .header p { color: #6b7280; margin: 5px 0; }
        
        .summary { 
            background-color: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 20px; 
        }
        .summary h3 { margin: 0 0 10px 0; color: #1e40af; }
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 10px; 
        }
        .summary-item { 
            background: white; 
            padding: 10px; 
            border-radius: 4px; 
            border-left: 4px solid #3b82f6; 
        }
        
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th { 
            background-color: #1e40af; 
            color: white; 
            padding: 12px 8px; 
            text-align: left; 
            font-weight: bold; 
            border: 1px solid #1e40af;
        }
        
        td { 
            padding: 10px 8px; 
            border: 1px solid #e5e7eb; 
            vertical-align: top;
        }
        
        tr:nth-child(even) { background-color: #f9fafb; }
        tr:hover { background-color: #eff6ff; }
        
        .role-admin { background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .role-technician { background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .role-user { background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        
        .nowrap { white-space: nowrap; }
        .center { text-align: center; }
        
        .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
            color: #6b7280; 
            font-size: 12px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>👥 รายงานข้อมูลผู้ใช้</h1>
        <p>สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        <p>ผู้ส่งออก: ${user?.full_name || user?.username || 'ไม่ระบุ'}</p>
    </div>
    
    <div class="summary">
        <h3>📊 สรุปข้อมูล</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <strong>จำนวนผู้ใช้ทั้งหมด:</strong><br>
                ${exportData.length.toLocaleString('th-TH')} คน
            </div>
            <div class="summary-item">
                <strong>ผู้ดูแลระบบ:</strong><br>
                ${users.filter(u => u.role === 'admin').length.toLocaleString('th-TH')} คน
            </div>
            <div class="summary-item">
                <strong>ช่างเทคนิค:</strong><br>
                ${users.filter(u => u.role === 'technician').length.toLocaleString('th-TH')} คน
            </div>
            <div class="summary-item">
                <strong>ผู้ใช้งานทั่วไป:</strong><br>
                ${users.filter(u => u.role === 'user').length.toLocaleString('th-TH')} คน
            </div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 80px;">ID</th>
                <th style="width: 120px;">ชื่อผู้ใช้</th>
                <th style="width: 200px;">ชื่อ-นามสกุล</th>
                <th style="width: 200px;">อีเมล</th>
                <th style="width: 120px;">เบอร์โทร</th>
                <th style="width: 100px;">บทบาท</th>
                <th style="width: 120px;">วันที่สมัคร</th>
                <th style="width: 120px;">เข้าสู่ระบบล่าสุด</th>
                <th style="width: 80px;">แจ้งเตือน</th>
            </tr>
        </thead>
        <tbody>
            ${exportData.map(userData => `
                <tr>
                    <td class="nowrap center">${userData.id}</td>
                    <td><strong>${(userData.username || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong></td>
                    <td>${(userData.full_name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td>${(userData.email || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                    <td class="center">${userData.phone || '-'}</td>
                    <td class="center">
                        <span class="role-${userData.role}">${getRoleText(userData.role)}</span>
                    </td>
                    <td class="nowrap center">${new Date(userData.created_at).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })}</td>
                    <td class="nowrap center">${userData.last_login ? new Date(userData.last_login).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }) : 'ไม่เคยเข้าสู่ระบบ'}</td>
                    <td class="center">${userData.notification_enabled ? '✅ เปิด' : '❌ ปิด'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        <p>📄 รายงานนี้สร้างโดยระบบแจ้งซ่อม | รวม ${exportData.length.toLocaleString('th-TH')} ผู้ใช้</p>
        <p>สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
    </div>
</body>
</html>`;

            const blob = new Blob([htmlContent], {
                type: 'application/vnd.ms-excel;charset=utf-8'
            });

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);

            const fileName = `รายงานผู้ใช้_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xls`;
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`ส่งออกรายงาน ${exportData.length} ผู้ใช้สำเร็จ! 📊`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
            case 'technician':
                return <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
            case 'user':
                return <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />;
            default:
                return <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
        }
    };

    const getRoleText = (role) => {
        const roleMap = {
            'admin': 'ผู้ดูแลระบบ',
            'technician': 'ช่างเทคนิค',
            'user': 'ผู้ใช้งาน'
        };
        return roleMap[role] || role;
    };

    const getRoleBadge = (role) => {
        const badgeMap = {
            'admin': 'bg-red-100 text-red-800 border-red-200',
            'technician': 'bg-blue-100 text-blue-800 border-blue-200',
            'user': 'bg-green-100 text-green-800 border-green-200'
        };
        return badgeMap[role] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // ตรวจสอบว่าไม่ใช่ admin หลัก
    const canDeleteUser = (userData) => {
        return userData.id !== 1 && userData.id !== user?.id;
    };

    // ปรับปรุงการกรองให้ทำงานจริง
    const filteredUsers = users.filter(userData => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
            userData.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.phone?.toLowerCase().includes(searchTerm.toLowerCase());

        // Role filter
        const matchesRole = roleFilter === 'all' || userData.role === roleFilter;

        // Status filter - สมมติว่าผู้ใช้ active ถ้าเข้าสู่ระบบใน 30 วันที่ผ่านมา
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const isActive = userData.last_login && new Date(userData.last_login) > thirtyDaysAgo;

            matchesStatus = statusFilter === 'active' ? isActive : !isActive;
        }

        return matchesSearch && matchesRole && matchesStatus;
    });

    // เพิ่มการเรียงลำดับ
    const filteredAndSortedUsers = [...filteredUsers].sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
            case 'created_at':
                aValue = new Date(a.created_at);
                bValue = new Date(b.created_at);
                break;
            case 'role':
                const roleOrder = { 'admin': 3, 'technician': 2, 'user': 1 };
                aValue = roleOrder[a.role] || 0;
                bValue = roleOrder[b.role] || 0;
                break;
            case 'last_login':
                aValue = a.last_login ? new Date(a.last_login) : new Date(0);
                bValue = b.last_login ? new Date(b.last_login) : new Date(0);
                break;
            case 'full_name':
                aValue = a.full_name?.toLowerCase() || '';
                bValue = b.full_name?.toLowerCase() || '';
                break;
            default:
                aValue = a[sortField] || '';
                bValue = b[sortField] || '';
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Mobile-friendly header content
    const headerContent = (
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                    รีเฟรช
                </button>

                {filteredAndSortedUsers.length > 0 && (
                    <button
                        onClick={exportToExcel}
                        className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                        <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                )}
            </div>

            <button
                onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                }}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto justify-center"
            >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">เพิ่มผู้ใช้</span>
            </button>
        </div>
    );

    // ตรวจสอบสิทธิ์
    if (user?.role !== 'admin') {
        return (
            <Layout title="ไม่มีสิทธิ์เข้าถึง">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                        <p className="text-gray-600 text-sm sm:text-base">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (loading) {
        return (
            <Layout title="จัดการผู้ใช้">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="จัดการผู้ใช้" headerContent={headerContent}>
            <div className="space-y-4 sm:space-y-6">
                {/* Page Description */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">จัดการข้อมูลผู้ใช้</h2>
                            <p className="text-gray-600 text-sm sm:text-base">เพิ่ม แก้ไข และจัดการผู้ใช้ในระบบ</p>
                        </div>
                        <div className="text-left sm:text-right text-sm text-gray-500 mt-2 sm:mt-0">
                            <p>ผู้ดูแล: {user?.full_name || user?.username}</p>
                            <p>สิทธิ์: ผู้ดูแลระบบ</p>
                        </div>
                    </div>
                </div>

                {/* Mobile Filters Toggle */}
                <div className="block sm:hidden">
                    <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center">
                            <Filter className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">ตัวกรอง</span>
                            {(roleFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    {[
                                        searchTerm && 'ค้นหา',
                                        roleFilter !== 'all' && 'บทบาท',
                                        statusFilter !== 'all' && 'สถานะ'
                                    ].filter(Boolean).length}
                                </span>
                            )}
                        </div>
                        {showMobileFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>

                {/* Enhanced Filters */}
                <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 ${showMobileFilters ? 'block' : 'hidden sm:block'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Filter className="w-5 h-5 text-gray-400 mr-2" />
                            <h3 className="text-lg font-medium text-gray-900">ตัวกรอง</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="hidden sm:block px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                                {showAdvancedFilters ? 'ซ่อนตัวกรองเพิ่มเติม' : 'แสดงตัวกรองเพิ่มเติม'}
                            </button>
                            <button
                                onClick={clearAllFilters}
                                className="px-2 sm:px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                            >
                                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">ล้างตัวกรอง</span>
                                <span className="sm:hidden">ล้าง</span>
                            </button>
                        </div>
                    </div>

                    {/* Basic Filters */}
                    <div className="space-y-4">
                        {/* Search */}
                        <div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                    type="text"
                                    placeholder="ค้นหา... (ชื่อผู้ใช้, ชื่อ-นามสกุล, อีเมล)"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Role Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                >
                                    <option value="all">ทุกบทบาท</option>
                                    <option value="admin">ผู้ดูแลระบบ</option>
                                    <option value="technician">ช่างเทคนิค</option>
                                    <option value="user">ผู้ใช้งาน</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                >
                                    <option value="all">ทุกสถานะ</option>
                                    <option value="active">ใช้งานล่าสุด (30 วัน)</option>
                                    <option value="inactive">ไม่ได้ใช้งาน</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(roleFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                        <div className="border-t pt-4 mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ตัวกรองที่ใช้งาน
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {roleFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        บทบาท: {getRoleText(roleFilter)}
                                        <button
                                            onClick={() => setRoleFilter('all')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {statusFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        สถานะ: {statusFilter === 'active' ? 'ใช้งานล่าสุด' : 'ไม่ได้ใช้งาน'}
                                        <button
                                            onClick={() => setStatusFilter('all')}
                                            className="ml-1 text-green-600 hover:text-green-800"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {searchTerm && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        ค้นหา: "{searchTerm}"
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="ml-1 text-gray-600 hover:text-gray-800"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
                        <div className="flex items-center">
                            <div className="p-1 sm:p-2 bg-red-100 rounded-lg">
                                <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                            </div>
                            <div className="ml-2 sm:ml-4">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">ผู้ดูแลระบบ</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                    {users.filter(u => u.role === 'admin').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
                        <div className="flex items-center">
                            <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
                                <Wrench className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                            </div>
                            <div className="ml-2 sm:ml-4">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">ช่างเทคนิค</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                    {users.filter(u => u.role === 'technician').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
                        <div className="flex items-center">
                            <div className="p-1 sm:p-2 bg-green-100 rounded-lg">
                                <User className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                            </div>
                            <div className="ml-2 sm:ml-4">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">ผู้ใช้งาน</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                    {users.filter(u => u.role === 'user').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
                        <div className="flex items-center">
                            <div className="p-1 sm:p-2 bg-gray-100 rounded-lg">
                                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                            </div>
                            <div className="ml-2 sm:ml-4">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">ทั้งหมด</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900">{users.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                                รายการผู้ใช้ ({filteredAndSortedUsers.length.toLocaleString('th-TH')})
                            </h3>

                            {/* Sort Options */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-gray-600">เรียงตาม:</span>
                                <button
                                    onClick={() => handleSort('created_at')}
                                    className={`flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${sortField === 'created_at'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    วันที่สมัคร
                                    {sortField === 'created_at' && (
                                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleSort('role')}
                                    className={`flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${sortField === 'role'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    บทบาท
                                    {sortField === 'role' && (
                                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleSort('full_name')}
                                    className={`flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${sortField === 'full_name'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    ชื่อ
                                    {sortField === 'full_name' && (
                                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Filter Summary */}
                        {(roleFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>ผลการกรอง:</strong> แสดง {filteredAndSortedUsers.length.toLocaleString('th-TH')} ผู้ใช้ จากทั้งหมด {users.length.toLocaleString('th-TH')} ผู้ใช้
                                    {filteredAndSortedUsers.length !== users.length && (
                                        <button
                                            onClick={clearAllFilters}
                                            className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                        >
                                            แสดงทั้งหมด
                                        </button>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="divide-y divide-gray-200">
                        {currentUsers.length === 0 ? (
                            <div className="p-8 text-center">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-2">
                                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                                        ? 'ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา'
                                        : 'ไม่มีผู้ใช้ในระบบ'}
                                </p>
                                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' ? (
                                    <button
                                        onClick={clearAllFilters}
                                        className="inline-flex items-center mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        ล้างตัวกรองทั้งหมด
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setShowCreateModal(true);
                                        }}
                                        className="inline-flex items-center mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        เพิ่มผู้ใช้แรก
                                    </button>
                                )}
                            </div>
                        ) : (
                            currentUsers.map((userData) => (
                                <div key={userData.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col sm:flex-row items-start justify-between">
                                        <div className="flex items-start space-x-3 sm:space-x-4 w-full">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm sm:text-lg font-bold flex-shrink-0">
                                                {userData.full_name?.charAt(0) || userData.username?.charAt(0) || 'U'}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                                                    {getRoleIcon(userData.role)}
                                                    <h4 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                                                        {userData.full_name || 'ไม่ระบุชื่อ'}
                                                    </h4>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadge(userData.role)} flex-shrink-0`}>
                                                        {getRoleText(userData.role)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-gray-500">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center">
                                                            <User className="w-4 h-4 mr-2 flex-shrink-0" />
                                                            <span className="font-mono text-xs sm:text-sm truncate">{userData.username}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                                                            <span className="text-xs sm:text-sm truncate">{userData.email}</span>
                                                        </div>
                                                        {userData.phone && (
                                                            <div className="flex items-center">
                                                                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                                                                <span className="text-xs sm:text-sm">{userData.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                                                            <span className="text-xs sm:text-sm">สมัคร: {new Date(userData.created_at).toLocaleDateString('th-TH', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <UserCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                                                            <span className="text-xs sm:text-sm">เข้าล่าสุด: {userData.last_login ?
                                                                new Date(userData.last_login).toLocaleDateString('th-TH', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                }) : 'ไม่เคยเข้าสู่ระบบ'
                                                            }</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
                                                            <span className="text-xs sm:text-sm">ID: {userData.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 mt-3 sm:mt-0 sm:ml-4 w-full sm:w-auto">
                                            <button
                                                onClick={() => openEditModal(userData)}
                                                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                แก้ไข
                                            </button>

                                            {canDeleteUser(userData) && (
                                                <button
                                                    onClick={() => openDeleteModal(userData)}
                                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    ลบ
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 sm:p-6 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                                <div className="text-sm text-gray-600">
                                    แสดง {(startIndex + 1).toLocaleString('th-TH')}-{Math.min(endIndex, filteredAndSortedUsers.length).toLocaleString('th-TH')} จาก {filteredAndSortedUsers.length.toLocaleString('th-TH')} ผู้ใช้
                                </div>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-2 sm:px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ก่อนหน้า
                                    </button>

                                    {/* Mobile pagination - show fewer pages */}
                                    <div className="hidden sm:flex items-center space-x-2">
                                        {[...Array(totalPages)].map((_, index) => {
                                            const page = index + 1;
                                            if (
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 2 && page <= currentPage + 2)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-3 py-2 text-sm rounded-lg ${page === currentPage
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (
                                                (page === currentPage - 3 && currentPage > 4) ||
                                                (page === currentPage + 3 && currentPage < totalPages - 3)
                                            ) {
                                                return <span key={page} className="px-2 text-gray-400">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    {/* Mobile pagination - simple current page display */}
                                    <div className="sm:hidden flex items-center px-3 py-2 bg-gray-100 rounded-lg">
                                        <span className="text-sm text-gray-600">
                                            {currentPage} / {totalPages}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-2 sm:px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ถัดไป
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">เพิ่มผู้ใช้ใหม่</h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ชื่อผู้ใช้ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.username ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                                    />
                                    {formErrors.username && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        อีเมล <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.email ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="อีเมลของผู้ใช้"
                                    />
                                    {formErrors.email && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                                    )}
                                </div>

                                {/* Full Name */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.full_name ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="ชื่อ-นามสกุลเต็ม"
                                    />
                                    {formErrors.full_name && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.full_name}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        เบอร์โทรศัพท์
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0xx-xxx-xxxx"
                                    />
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        บทบาท <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="user">ผู้ใช้งาน</option>
                                        <option value="technician">ช่างเทคนิค</option>
                                        <option value="admin">ผู้ดูแลระบบ</option>
                                    </select>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        รหัสผ่าน <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.password ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="รหัสผ่านสำหรับเข้าสู่ระบบ"
                                    />
                                    {formErrors.password && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="ยืนยันรหัสผ่าน"
                                    />
                                    {formErrors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>

                            {/* Notification */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    การแจ้งเตือน
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.notification_enabled}
                                        onChange={(e) => setFormData({ ...formData, notification_enabled: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 text-sm text-gray-900">
                                        เปิดใช้งานการแจ้งเตือน
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                >
                                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    สร้างผู้ใช้
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    แก้ไขผู้ใช้: {selectedUser.full_name || selectedUser.username}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedUser(null);
                                        resetForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleEditUser} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ชื่อผู้ใช้ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.username ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                                    />
                                    {formErrors.username && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        อีเมล <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.email ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="อีเมลของผู้ใช้"
                                    />
                                    {formErrors.email && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                                    )}
                                </div>

                                {/* Full Name */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.full_name ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="ชื่อ-นามสกุลเต็ม"
                                    />
                                    {formErrors.full_name && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.full_name}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        เบอร์โทรศัพท์
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0xx-xxx-xxxx"
                                    />
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        บทบาท <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={selectedUser.id === 1} // ป้องกันการเปลี่ยน role ของ admin หลัก
                                    >
                                        <option value="user">ผู้ใช้งาน</option>
                                        <option value="technician">ช่างเทคนิค</option>
                                        <option value="admin">ผู้ดูแลระบบ</option>
                                    </select>
                                    {selectedUser.id === 1 && (
                                        <p className="mt-1 text-sm text-gray-500">ไม่สามารถเปลี่ยนบทบาทของผู้ดูแลหลักได้</p>
                                    )}
                                </div>
                            </div>

                            {/* Notification */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    การแจ้งเตือน
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.notification_enabled}
                                        onChange={(e) => setFormData({ ...formData, notification_enabled: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 text-sm text-gray-900">
                                        เปิดใช้งานการแจ้งเตือน
                                    </label>
                                </div>
                            </div>

                            {/* Password Section */}
                            <div className="border-t pt-4 sm:pt-6">
                                <h4 className="text-md font-medium text-gray-900 mb-4">เปลี่ยนรหัสผ่าน (ไม่บังคับ)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            รหัสผ่านใหม่
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.password ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="ใส่รหัสผ่านใหม่หากต้องการเปลี่ยน"
                                        />
                                        {formErrors.password && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                                        )}
                                        <p className="mt-1 text-sm text-gray-500">ปล่อยว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน</p>
                                    </div>

                                    {/* Confirm New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ยืนยันรหัสผ่านใหม่
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="ยืนยันรหัสผ่านใหม่"
                                        />
                                        {formErrors.confirmPassword && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedUser(null);
                                        resetForm();
                                    }}
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                >
                                    <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    บันทึกการเปลี่ยนแปลง
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete User Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                </div>
                                <div className="ml-3 sm:ml-4">
                                    <h3 className="text-lg font-semibold text-gray-900">ลบผู้ใช้</h3>
                                    <p className="text-sm text-gray-500">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-700 mb-4">
                                    คุณแน่ใจหรือไม่ที่ต้องการลบผู้ใช้ <strong>{selectedUser.full_name || selectedUser.username}</strong>?
                                </p>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-start">
                                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-yellow-800 font-medium">คำเตือน</p>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                การลบผู้ใช้จะส่งผลต่อ:
                                            </p>
                                            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                                                <li>การแจ้งซ่อมที่เกี่ยวข้อง</li>
                                                <li>ประวัติการทำงาน</li>
                                                <li>ข้อมูลการเข้าสู่ระบบ</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedUser(null);
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    ลบผู้ใช้
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default UserManagement;