// SystemSettings.js - Complete React Component (แก้ไข key props แล้ว)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000';

const SystemSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState([]);
  const [showSensitive, setShowSensitive] = useState({});
  const [testResult, setTestResult] = useState(null);

  const h = React.createElement;

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    
    console.log('Auth check - user:', user, 'token:', !!token);
    
    if (!token) {
      showToast('กรุณาเข้าสู่ระบบ', 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return false;
    }
    
    if (!user || user.role !== 'admin') {
      console.log('User role check failed:', user?.role);
      showToast('ไม่มีสิทธิ์เข้าถึงหน้านี้ (ต้องเป็น Admin)', 'error');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      return false;
    }
    
    console.log('Auth check passed');
    return true;
  };

  const showToast = (message, type = 'info') => {
    if (window.toast) {
      if (type === 'error') {
        window.toast.error(message);
      } else if (type === 'success') {
        window.toast.success(message);
      } else {
        window.toast(message);
      }
    } else if (window.alert) {
      alert(`${type.toUpperCase()}: ${message}`);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/repairs/system-settings`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 404) {
        console.warn('System settings API not found, using mock data');
        const mockSettings = getMockSettings();
        setSettings(mockSettings);
        showToast('API ยังไม่พร้อม - แสดงข้อมูลจำลอง', 'info');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSettings(Array.isArray(data) ? data : []);
      console.log('Settings loaded:', data);
    } catch (error) {
      console.error('Fetch settings error:', error);
      
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        const mockSettings = getMockSettings();
        setSettings(mockSettings);
        showToast('API ยังไม่พร้อม - แสดงข้อมูลจำลอง', 'info');
      } else {
        showToast('เกิดข้อผิดพลาดในการโหลดการตั้งค่า: ' + error.message, 'error');
        setSettings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockSettings = () => {
    return [
      {
        setting_key: 'line_channel_access_token',
        setting_value: '••••••••',
        setting_type: 'string',
        description: 'LINE Channel Access Token สำหรับส่งข้อความ',
        is_sensitive: true
      },
      {
        setting_key: 'line_channel_secret',
        setting_value: '••••••••',
        setting_type: 'string',
        description: 'LINE Channel Secret สำหรับยืนยันตัวตน',
        is_sensitive: true
      },
      {
        setting_key: 'line_group_id',
        setting_value: '',
        setting_type: 'string',
        description: 'LINE Group ID ที่จะส่งการแจ้งเตือน',
        is_sensitive: false
      },
      {
        setting_key: 'line_notifications_enabled',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'เปิด/ปิด การแจ้งเตือนผ่าน LINE',
        is_sensitive: false
      },
      {
        setting_key: 'notification_new_repair',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'แจ้งเตือนเมื่อมีการแจ้งซ่อมใหม่',
        is_sensitive: false
      },
      {
        setting_key: 'notification_status_update',
        setting_value: 'true',
        setting_type: 'boolean',
        description: 'แจ้งเตือนเมื่อมีการอัพเดทสถานะ',
        is_sensitive: false
      },
      {
        setting_key: 'system_name',
        setting_value: 'ระบบแจ้งซ่อม',
        setting_type: 'string',
        description: 'ชื่อของระบบ',
        is_sensitive: false
      },
      {
        setting_key: 'admin_email',
        setting_value: 'admin@example.com',
        setting_type: 'string',
        description: 'อีเมลของผู้ดูแลระบบ',
        is_sensitive: false
      },
      {
        setting_key: 'max_image_size_mb',
        setting_value: '10',
        setting_type: 'number',
        description: 'ขนาดไฟล์รูปภาพสูงสุด (MB)',
        is_sensitive: false
      },
      {
        setting_key: 'max_images_per_request',
        setting_value: '5',
        setting_type: 'number',
        description: 'จำนวนรูปภาพสูงสุดต่อการแจ้งซ่อม',
        is_sensitive: false
      }
    ];
  };

  const handleSettingChange = (settingKey, newValue) => {
    setSettings(prev => prev.map(setting => 
      setting.setting_key === settingKey 
        ? { ...setting, setting_value: newValue }
        : setting
    ));
    console.log(`Setting changed: ${settingKey} = ${newValue}`);
  };

  const toggleShowSensitive = async (settingKey) => {
    if (showSensitive[settingKey]) {
      setShowSensitive(prev => ({ ...prev, [settingKey]: false }));
    } else {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${API_BASE_URL}/api/repairs/system-settings/${settingKey}?reveal=true`,
          { 
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to reveal setting');
        }
        
        const data = await response.json();
        
        setSettings(prev => prev.map(setting => 
          setting.setting_key === settingKey 
            ? { ...setting, setting_value: data.setting_value }
            : setting
        ));
        setShowSensitive(prev => ({ ...prev, [settingKey]: true }));
      } catch (error) {
        console.error('Toggle sensitive error:', error);
        showToast('เกิดข้อผิดพลาดในการแสดงข้อมูล', 'error');
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const settingsToUpdate = settings.map(setting => ({
        setting_key: setting.setting_key,
        setting_value: setting.setting_value
      }));

      console.log('Saving settings:', settingsToUpdate);

      const response = await fetch(
        `${API_BASE_URL}/api/repairs/system-settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ settings: settingsToUpdate })
        }
      );

      if (response.status === 404) {
        showToast('API ยังไม่พร้อม - การตั้งค่าจะไม่ถูกบันทึก', 'error');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }

      const result = await response.json();
      const successCount = result.success_count || 0;
      const totalCount = result.total_count || settingsToUpdate.length;

      if (successCount === totalCount) {
        showToast('บันทึกการตั้งค่าสำเร็จ! 🎉', 'success');
      } else {
        showToast(`บันทึกสำเร็จ ${successCount}/${totalCount} รายการ`, 'success');
      }

      await fetchSettings();
    } catch (error) {
      console.error('Save settings error:', error);
      if (error.message.includes('404')) {
        showToast('API ยังไม่พร้อม - การตั้งค่าจะไม่ถูกบันทึก', 'error');
      } else {
        showToast('เกิดข้อผิดพลาดในการบันทึก: ' + error.message, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const testLineConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const token = localStorage.getItem('token');
      const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
      
      const testData = {
        title: 'ทดสอบการแจ้งเตือน LINE',
        requester_name: userData.full_name || 'ผู้ดูแลระบบ',
        location: 'ระบบทดสอบ - หน้าตั้งค่า',
        priority: 'medium',
        imageCount: 0
      };

      console.log('Testing LINE connection with data:', testData);

      const response = await fetch(
        `${API_BASE_URL}/api/repairs/system-settings/test/line-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(testData)
        }
      );

      const result = await response.json();
      console.log('Test result:', result);

      if (result.success) {
        setTestResult({ success: true, message: 'ส่งข้อความทดสอบสำเร็จ!' });
        showToast('ส่งข้อความทดสอบสำเร็จ! ตรวจสอบในกลุ่ม LINE', 'success');
      } else {
        setTestResult({ success: false, message: result.error || 'การทดสอบล้มเหลว' });
        showToast('การทดสอบล้มเหลว: ' + (result.error || 'ไม่ทราบสาเหตุ'), 'error');
      }
    } catch (error) {
      console.error('Test LINE error:', error);
      const errorMessage = error.message || 'เกิดข้อผิดพลาดในการทดสอบ';
      setTestResult({ success: false, message: errorMessage });
      showToast('เกิดข้อผิดพลาดในการทดสอบ: ' + errorMessage, 'error');
    } finally {
      setTesting(false);
    }
  };

  const getSettingsByCategory = () => {
    return {
      line: {
        title: 'LINE Messaging',
        icon: 'message-square',
        color: 'text-green-600',
        settings: settings.filter(s => s.setting_key.startsWith('line_'))
      },
      notifications: {
        title: 'การแจ้งเตือน',
        icon: 'bell',
        color: 'text-blue-600',
        settings: settings.filter(s => s.setting_key.startsWith('notification_'))
      },
      system: {
        title: 'ระบบทั่วไป',
        icon: 'settings',
        color: 'text-gray-600',
        settings: settings.filter(s => 
          s.setting_key.startsWith('system_') || 
          s.setting_key.startsWith('admin_') ||
          s.setting_key.startsWith('max_')
        )
      }
    };
  };

  const getSettingLabel = (settingKey) => {
    const labels = {
      'line_channel_access_token': 'Channel Access Token *',
      'line_channel_secret': 'Channel Secret *',
      'line_group_id': 'Group ID *',
      'line_notifications_enabled': 'เปิดใช้งานการแจ้งเตือน',
      'line_webhook_url': 'Webhook URL',
      'notification_new_repair': 'แจ้งเตือนการแจ้งซ่อมใหม่',
      'notification_status_update': 'แจ้งเตือนการอัพเดทสถานะ',
      'system_name': 'ชื่อระบบ',
      'admin_email': 'อีเมลผู้ดูแลระบบ',
      'max_image_size_mb': 'ขนาดไฟล์รูปภาพสูงสุด (MB)',
      'max_images_per_request': 'จำนวนรูปภาพสูงสุดต่อการแจ้งซ่อม'
    };
    return labels[settingKey] || settingKey;
  };

  // ✅ แก้ไขฟังก์ชัน renderSettingInput โดยเพิ่ม key props
  const renderSettingInput = (setting) => {
    const isBoolean = setting.setting_type === 'boolean';
    const isNumber = setting.setting_type === 'number';
    const isSensitive = setting.is_sensitive;
    const isHidden = isSensitive && !showSensitive[setting.setting_key];
    
    const isRequired = setting.setting_key === 'line_channel_access_token' || 
                      setting.setting_key === 'line_channel_secret' || 
                      setting.setting_key === 'line_group_id';
    const isEmpty = !setting.setting_value || setting.setting_value.trim() === '' || setting.setting_value === '••••••••';
    const hasError = isRequired && isEmpty && !isHidden;

    if (isBoolean) {
      return h('div', {
        key: `boolean-wrapper-${setting.setting_key}`,
        className: 'flex items-center space-x-3'
      }, [
        h('input', {
          key: `checkbox-${setting.setting_key}`,
          type: 'checkbox',
          id: setting.setting_key,
          checked: setting.setting_value === 'true',
          onChange: (e) => handleSettingChange(setting.setting_key, e.target.checked ? 'true' : 'false'),
          className: 'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
        }),
        h('label', {
          key: `label-${setting.setting_key}`,
          htmlFor: setting.setting_key,
          className: 'text-sm text-gray-700 cursor-pointer'
        }, setting.setting_value === 'true' ? 'เปิดใช้งาน' : 'ปิดใช้งาน')
      ]);
    }

    const inputElement = h('input', {
      key: `input-${setting.setting_key}`,
      type: isHidden ? 'password' : (isNumber ? 'number' : 'text'),
      value: isHidden ? '••••••••' : (setting.setting_value || ''),
      onChange: (e) => handleSettingChange(setting.setting_key, e.target.value),
      className: `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
        hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
      }`,
      placeholder: setting.setting_key === 'line_channel_access_token' ? 'กรุณากรอก Channel Access Token' :
                   setting.setting_key === 'line_channel_secret' ? 'กรุณากรอก Channel Secret' :
                   setting.setting_key === 'line_group_id' ? 'กรุณากรอก Group ID (เช่น C1234567890...)' :
                   setting.description,
      disabled: isHidden,
      required: isRequired
    });

    if (isSensitive) {
      return h('div', {
        key: `sensitive-wrapper-${setting.setting_key}`,
        className: 'relative'
      }, [
        inputElement,
        h('button', {
          key: `toggle-${setting.setting_key}`,
          type: 'button',
          onClick: () => toggleShowSensitive(setting.setting_key),
          className: 'absolute right-2 top-2 text-gray-400 hover:text-gray-600 transition-colors'
        }, h('svg', {
          key: `eye-${setting.setting_key}`,
          className: 'w-4 h-4',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        }, h('path', {
          key: `path-${setting.setting_key}`,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '2',
          d: showSensitive[setting.setting_key] ? 
            'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21' :
            'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
        })))
      ]);
    }

    return inputElement;
  };

  const renderSettingField = (setting) => {
    const isRequired = setting.setting_key === 'line_channel_access_token' || 
                      setting.setting_key === 'line_channel_secret' || 
                      setting.setting_key === 'line_group_id';
    const isEmpty = !setting.setting_value || setting.setting_value.trim() === '' || setting.setting_value === '••••••••';
    const hasError = isRequired && isEmpty;

    return h('div', {
      key: `field-${setting.setting_key}`,
      className: 'space-y-2'
    }, [
      h('label', {
        key: `field-label-${setting.setting_key}`,
        className: 'block text-sm font-medium text-gray-700'
      }, [
        h('span', {
          key: `label-text-${setting.setting_key}`,
          className: setting.setting_key === 'line_channel_access_token' || setting.setting_key === 'line_channel_secret' ? 'text-gray-700' : 'text-gray-700'
        }, getSettingLabel(setting.setting_key)),
        (setting.setting_key === 'line_channel_access_token' || setting.setting_key === 'line_channel_secret' || setting.setting_key === 'line_group_id') && h('span', {
          key: `required-${setting.setting_key}`,
          className: 'text-red-500 ml-1'
        }, '*'),
        setting.is_sensitive && h('svg', {
          key: `shield-${setting.setting_key}`,
          className: 'w-4 h-4 text-yellow-500 inline ml-1',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        }, h('path', {
          key: `shield-path-${setting.setting_key}`,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '2',
          d: 'M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
        }))
      ]),
      renderSettingInput(setting),
      setting.description && h('p', {
        key: `field-description-${setting.setting_key}`,
        className: 'text-xs text-gray-500'
      }, setting.description),
      hasError && h('p', {
        key: `field-error-${setting.setting_key}`,
        className: 'text-xs text-red-600 mt-1'
      }, `${getSettingLabel(setting.setting_key).replace(' *', '')} เป็นฟิลด์ที่จำเป็นต้องกรอก`),
      setting.setting_key === 'line_group_id' && h('div', {
        key: `help-${setting.setting_key}`,
        className: 'mt-2 p-3 bg-blue-50 rounded-md border border-blue-200'
      }, h('div', {
        key: `help-content-${setting.setting_key}`,
        className: 'flex'
      }, [
        h('svg', {
          key: `help-icon-${setting.setting_key}`,
          className: 'w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        }, h('path', {
          key: `help-path-${setting.setting_key}`,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '2',
          d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        })),
        h('div', {
          key: `help-text-${setting.setting_key}`,
          className: 'text-sm text-blue-800'
        }, [
          h('p', {
            key: `help-title-${setting.setting_key}`,
            className: 'font-medium mb-1'
          }, 'วิธีหา Group ID:'),
          h('ol', {
            key: `help-list-${setting.setting_key}`,
            className: 'list-decimal list-inside space-y-1 text-xs'
          }, [
            h('li', { key: `help-1-${setting.setting_key}` }, 'เพิ่มบอทเข้ากลุ่ม LINE ที่ต้องการ'),
            h('li', { key: `help-2-${setting.setting_key}` }, 'ส่งข้อความใดๆ ในกลุ่ม'),
            h('li', { key: `help-3-${setting.setting_key}` }, 'ตรวจสอบ Webhook logs เพื่อดู Group ID'),
            h('li', { key: `help-4-${setting.setting_key}` }, 'หรือใช้ LINE Bot SDK เพื่อดึง Group ID'),
            h('li', { key: `help-5-${setting.setting_key}` }, 'Group ID จะขึ้นต้นด้วย "C" ตามด้วยตัวเลข')
          ])
        ])
      ]))
    ]);
  };

  const renderCategorySection = (category, categoryData) => {
    if (categoryData.settings.length === 0) return null;

    return h('div', {
      key: `category-${category}`,
      className: 'bg-white shadow rounded-lg'
    }, [
      h('div', {
        key: `header-${category}`,
        className: 'px-6 py-4 border-b border-gray-200'
      }, h('div', {
        key: `header-content-${category}`,
        className: 'flex items-center justify-between'
      }, [
        h('div', {
          key: `title-${category}`,
          className: 'flex items-center'
        }, [
          h('svg', {
            key: `icon-${category}`,
            className: `w-5 h-5 ${categoryData.color} mr-3`,
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, h('path', {
            key: `path-${category}`,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: '2',
            d: category === 'line' ? 
              'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' :
              category === 'notifications' ?
              'M15 17h5l-5-5-5 5h5zm0 0V10.5A3.5 3.5 0 0011.5 7a3.5 3.5 0 00-3.5 3.5V17h3.5zm0 0h5v2.5A2.5 2.5 0 0117.5 22h-5a2.5 2.5 0 01-2.5-2.5V17h5z' :
              'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
          })),
          h('h2', {
            key: `text-${category}`,
            className: 'text-lg font-medium text-gray-900'
          }, categoryData.title)
        ]),
        category === 'line' && h('button', {
          key: `test-${category}`,
          onClick: testLineConnection,
          disabled: testing,
          className: 'inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors'
        }, [
          testing ? h('div', {
            key: `spinner-${category}`,
            className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2'
          }) : h('svg', {
            key: `test-icon-${category}`,
            className: 'w-4 h-4 mr-2',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, h('path', {
            key: `test-path-${category}`,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: '2',
            d: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
          })),
          testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'
        ])
      ])),
      category === 'line' && testResult && h('div', {
        key: `test-result-${category}`,
        className: `mx-6 mt-3 p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`
      }, h('div', {
        key: `test-result-content-${category}`,
        className: 'flex items-center'
      }, [
        h('svg', {
          key: `test-result-icon-${category}`,
          className: `w-5 h-5 ${testResult.success ? 'text-green-600' : 'text-red-600'} mr-2`,
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        }, h('path', {
          key: `test-result-path-${category}`,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '2',
          d: testResult.success ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        })),
        h('span', {
          key: `test-result-message-${category}`,
          className: `text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`
        }, testResult.message)
      ])),
      h('div', {
        key: `content-${category}`,
        className: 'px-6 py-4 space-y-6'
      }, categoryData.settings.map(setting => renderSettingField(setting)))
    ]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('SystemSettings mounted, user:', user);
      if (!checkAuth()) return;
      fetchSettings();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [user]);

  if (loading) {
    return h('div', {
      className: 'min-h-screen bg-gray-50 flex items-center justify-center'
    }, h('div', {
      className: 'text-center'
    }, [
      h('div', {
        key: 'loading-spinner',
        className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'
      }),
      h('p', {
        key: 'loading-text',
        className: 'text-gray-600'
      }, 'กำลังโหลดการตั้งค่า...')
    ]));
  }

  const categories = getSettingsByCategory();

  return h('div', {
    className: 'min-h-screen bg-gray-50'
  }, [
    h('header', {
      key: 'main-header',
      className: 'bg-white shadow-sm border-b border-gray-200'
    }, h('div', {
      key: 'header-container',
      className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
    }, h('div', {
      key: 'header-content',
      className: 'flex justify-between items-center py-4'
    }, [
      h('div', {
        key: 'header-title',
        className: 'flex items-center'
      }, [
        h('button', {
          key: 'back-button',
          onClick: () => navigate('/dashboard'),
          className: 'flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors'
        }, [
          h('svg', {
            key: 'back-icon',
            className: 'w-5 h-5 mr-2',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, h('path', {
            key: 'back-icon-path',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: '2',
            d: 'M15 19l-7-7 7-7'
          })),
          h('span', {
            key: 'back-text',
            className: 'text-sm'
          }, 'กลับ')
        ]),
        h('svg', {
          key: 'header-icon',
          className: 'w-6 h-6 text-blue-600 mr-3',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        }, h('path', {
          key: 'header-icon-path',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '2',
          d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
        })),
        h('h1', {
          key: 'header-text',
          className: 'text-2xl font-bold text-gray-900'
        }, 'ตั้งค่าระบบ')
      ]),
      h('div', {
        key: 'header-buttons',
        className: 'flex space-x-3'
      }, [
        h('button', {
          key: 'refresh-button',
          onClick: fetchSettings,
          disabled: loading,
          className: 'inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors'
        }, [
          h('svg', {
            key: 'refresh-icon',
            className: `w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`,
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, h('path', {
            key: 'refresh-icon-path',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: '2',
            d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
          })),
          'รีเฟรช'
        ]),
        h('button', {
          key: 'save-button',
          onClick: handleSave,
          disabled: saving || settings.length === 0,
          className: 'inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors'
        }, [
          saving ? h('div', {
            key: 'save-spinner',
            className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'
          }) : h('svg', {
            key: 'save-icon',
            className: 'w-4 h-4 mr-2',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, h('path', {
            key: 'save-icon-path',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: '2',
            d: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4'
          })),
          saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'
        ])
      ])
    ]))),

    h('main', {
      key: 'main-content',
      className: 'max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'
    }, h('div', {
      key: 'main-container',
      className: 'space-y-6'
    }, [
      renderCategorySection('line', categories.line),
      renderCategorySection('notifications', categories.notifications),
      renderCategorySection('system', categories.system),

      settings.length === 0 && !loading && h('div', {
        key: 'empty-state',
        className: 'bg-white shadow rounded-lg'
      }, h('div', {
        key: 'empty-content',
        className: 'text-center py-12'
      }, [
        h('svg', {
          key: 'empty-icon',
          className: 'mx-auto h-12 w-12 text-gray-400',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        }, h('path', {
          key: 'empty-icon-path',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '2',
          d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
        })),
        h('h3', {
          key: 'empty-title',
          className: 'mt-2 text-sm font-medium text-gray-900'
        }, 'ไม่พบการตั้งค่า'),
        h('p', {
          key: 'empty-description',
          className: 'mt-1 text-sm text-gray-500'
        }, 'ไม่มีการตั้งค่าในระบบ หรือเกิดข้อผิดพลาดในการโหลดข้อมูล'),
        h('div', {
          key: 'empty-action',
          className: 'mt-6'
        }, h('button', {
          key: 'empty-reload-button',
          onClick: fetchSettings,
          className: 'inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }, [
          h('svg', {
            key: 'empty-reload-icon',
            className: 'w-4 h-4 mr-2',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, h('path', {
            key: 'empty-reload-icon-path',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: '2',
            d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
          })),
          'โหลดใหม่'
        ]))
      ])),

      h('div', {
        key: 'footer-info',
        className: 'bg-blue-50 border border-blue-200 rounded-lg p-4'
      }, h('div', {
        key: 'footer-content',
        className: 'flex'
      }, [
        h('svg', {
          key: 'footer-icon',
          className: 'w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        }, h('path', {
          key: 'footer-icon-path',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '2',
          d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        })),
        h('div', {
          key: 'footer-text',
          className: 'text-sm text-blue-800'
        }, [
          h('h4', {
            key: 'footer-title',
            className: 'font-medium mb-2'
          }, 'คำแนะนำการใช้งาน:'),
          h('ul', {
            key: 'footer-list',
            className: 'space-y-1 text-xs'
          }, [
            h('li', { key: 'tip-1' }, '• การตั้งค่าที่มีไอคอนโล่ (🛡️) เป็นข้อมูลสำคัญที่ถูกเข้ารหัส'),
            h('li', { key: 'tip-2' }, '• คลิกไอคอนตาเพื่อแสดง/ซ่อนข้อมูลสำคัญ'),
            h('li', { key: 'tip-3' }, '• ใช้ปุ่ม "ทดสอบการเชื่อมต่อ" เพื่อตรวจสอบการทำงานของ LINE Bot'),
            h('li', { key: 'tip-4' }, '• อย่าลืมกด "บันทึกการตั้งค่า" หลังจากแก้ไขข้อมูล'),
            h('li', { key: 'tip-5' }, '• หากมีปัญหา ตรวจสอบ Console ของเบราว์เซอร์เพื่อดู Error logs')
          ])
        ])
      ]))
    ]))
  ]);
};

export default SystemSettings;