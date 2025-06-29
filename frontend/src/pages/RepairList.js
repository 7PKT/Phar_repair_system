import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  MapPin,
  User,
  Edit,
  Filter,
  RefreshCw,
  Download,
  SortAsc,
  SortDesc,
  FileSpreadsheet,
  X,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Menu,
  Grid3X3,
  List,
  MoreVertical,
  Archive,
  ArrowRight,
} from "lucide-react";

const RepairList = () => {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState("active"); // 'active', 'completed', 'all'

  // ตรวจจับขนาดหน้าจอ
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    fetchRepairs();
    fetchCategories();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    fetchRepairs();
  }, [
    statusFilter,
    priorityFilter,
    categoryFilter,
    technicianFilter,
    dateRangeFilter,
  ]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/repairs/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem("token");

      let response;
      try {
        response = await axios.get("/api/repairs/technicians", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ Successfully fetched technicians from new endpoint");
      } catch (techError) {
        response = await axios.get("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ Successfully fetched users from admin endpoint");
      }

      const techUsers = response.data.filter(
        (u) => u.role === "technician" || u.role === "admin"
      );
      setTechnicians(techUsers);
    } catch (error) {
      console.log("⚠️ Cannot fetch technicians data:", error.response?.status);
      setTechnicians([]);
    }
  };

  const fetchRepairs = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("ไม่พบ token การเข้าสู่ระบบ");
        return;
      }

      const response = await axios.get("/api/repairs", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const repairsData = response.data.repairs || response.data || [];
      console.log("All repairs from API:", repairsData);
      console.log("User role:", user?.role);
      console.log("User ID:", user?.id);

      setRepairs(repairsData);
    } catch (error) {
      console.error("Error fetching repairs:", error);

      if (error.response?.status === 401) {
        toast.error("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
      } else if (error.response?.status === 403) {
        toast.error("ไม่มีสิทธิ์เข้าถึงข้อมูล");
      } else if (error.response?.status >= 500) {
        toast.error("เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ภายหลัง");
      } else {
        toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRepairs();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setTechnicianFilter("all");
    setDateRangeFilter("all");
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  // ฟังก์ชันสำหรับย้ายรายการไป category เสร็จสิ้น
  const moveToCompletedCategory = async (repairId) => {
    try {
      const token = localStorage.getItem("token");

      // หา category เสร็จสิ้น หรือสร้างใหม่ถ้าไม่มี
      let completedCategory = categories.find(
        (cat) =>
          cat.name.toLowerCase().includes("เสร็จสิ้น") ||
          cat.name.toLowerCase().includes("completed")
      );

      if (!completedCategory) {
        // สร้าง category เสร็จสิ้นใหม่
        const categoryResponse = await axios.post(
          "/api/repairs/categories",
          { name: "เสร็จสิ้น", description: "รายการซ่อมที่เสร็จสิ้นแล้ว" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        completedCategory = categoryResponse.data;
        setCategories((prev) => [...prev, completedCategory]);
      }

      // อัพเดท repair ให้ไปอยู่ใน category เสร็จสิ้น
      await axios.put(
        `/api/repairs/${repairId}`,
        { category_id: completedCategory.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("ย้ายรายการไป category เสร็จสิ้นเรียบร้อย");
      fetchRepairs(); // รีเฟรชข้อมูล
    } catch (error) {
      console.error("Error moving to completed category:", error);
      toast.error("เกิดข้อผิดพลาดในการย้าย category");
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredAndSortedRepairs;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: 'Tahoma', sans-serif; 
            margin: 10px; 
            line-height: 1.4;
            font-size: 12px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 20px; 
            padding: 15px;
            border-bottom: 2px solid #2563eb;
        }
        .header h1 { 
            color: #2563eb; 
            margin: 0; 
            font-size: 18px; 
        }
        .header p { 
            color: #6b7280; 
            margin: 3px 0; 
            font-size: 11px;
        }
        
        .summary { 
            background-color: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 6px; 
            padding: 12px; 
            margin-bottom: 15px; 
        }
        .summary h3 { 
            margin: 0 0 8px 0; 
            color: #1e40af; 
            font-size: 14px;
        }
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 8px; 
        }
        .summary-item { 
            background: white; 
            padding: 8px; 
            border-radius: 4px; 
            border-left: 3px solid #3b82f6; 
            font-size: 11px;
        }
        
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            font-size: 11px;
        }
        
        th { 
            background-color: #1e40af; 
            color: white; 
            padding: 8px 6px; 
            text-align: left; 
            font-weight: bold; 
            border: 1px solid #1e40af;
            font-size: 10px;
        }
        
        td { 
            padding: 6px 4px; 
            border: 1px solid #e5e7eb; 
            vertical-align: top;
            font-size: 10px;
        }
        
        tr:nth-child(even) { background-color: #f9fafb; }
        tr:hover { background-color: #eff6ff; }
        
        .status-pending { background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .status-assigned { background-color: #e0e7ff; color: #5b21b6; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .status-in_progress { background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .status-completed { background-color: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .status-cancelled { background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        
        .priority-urgent { background-color: #fecaca; color: #991b1b; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold; }
        .priority-high { background-color: #fed7aa; color: #c2410c; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold; }
        .priority-medium { background-color: #fef3c7; color: #a16207; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold; }
        .priority-low { background-color: #f3f4f6; color: #4b5563; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold; }
        
        .description { max-width: 200px; word-wrap: break-word; line-height: 1.3; }
        .nowrap { white-space: nowrap; }
        .center { text-align: center; }
        
        .footer { 
            margin-top: 20px; 
            padding-top: 15px; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
            color: #6b7280; 
            font-size: 10px; 
        }

        @media print {
            body { margin: 0; font-size: 10px; }
            .header { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
        }

        @media screen and (max-width: 768px) {
            .summary-grid { grid-template-columns: repeat(2, 1fr); }
            table { font-size: 9px; }
            th, td { padding: 4px 2px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 รายงานการแจ้งซ่อม (${getViewModeText(activeView)})</h1>
        <p>สร้างเมื่อ: ${new Date().toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</p>
        <p>ผู้ส่งออก: ${user?.full_name || user?.username || "ไม่ระบุ"} (${
        user?.role === "admin"
          ? "ผู้ดูแลระบบ"
          : user?.role === "technician"
          ? "ช่างเทคนิค"
          : "ผู้ใช้งาน"
      })</p>
    </div>
    
    <div class="summary">
        <h3>📊 สรุปข้อมูล (${getViewModeText(activeView)})</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <strong>จำนวนรายการทั้งหมด:</strong><br>
                ${exportData.length.toLocaleString("th-TH")} รายการ
            </div>
            <div class="summary-item">
                <strong>รอดำเนินการ:</strong><br>
                ${getFilteredCount("pending").toLocaleString("th-TH")} รายการ
            </div>
            <div class="summary-item">
                <strong>กำลังดำเนินการ:</strong><br>
                ${(
                  getFilteredCount("assigned") + getFilteredCount("in_progress")
                ).toLocaleString("th-TH")} รายการ
            </div>
            <div class="summary-item">
                <strong>เสร็จสิ้นแล้ว:</strong><br>
                ${getFilteredCount("completed").toLocaleString("th-TH")} รายการ
            </div>
        </div>
        
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px;">
            <strong>🔍 ตัวกรองที่ใช้:</strong>
            ประเภท: ${getViewModeText(activeView)}, 
            สถานะ: ${
              statusFilter === "all" ? "ทั้งหมด" : getStatusText(statusFilter)
            }, 
            ความสำคัญ: ${
              priorityFilter === "all"
                ? "ทั้งหมด"
                : getPriorityText(priorityFilter)
            }, 
            หมวดหมู่: ${
              categoryFilter === "all"
                ? "ทั้งหมด"
                : categories.find((c) => c.id == categoryFilter)?.name ||
                  "ไม่ระบุ"
            }, 
            ช่วงเวลา: ${getDateRangeText(dateRangeFilter)}
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 60px;">รหัส</th>
                <th style="width: 150px;">หัวข้อ</th>
                <th style="width: 200px;">รายละเอียด</th>
                <th style="width: 80px;">สถานะ</th>
                <th style="width: 60px;">ระดับ</th>
                <th style="width: 120px;">สถานที่</th>
                <th style="width: 80px;">หมวดหมู่</th>
                <th style="width: 100px;">ผู้แจ้ง</th>
                <th style="width: 100px;">ผู้รับผิดชอบ</th>
                <th style="width: 80px;">วันที่สร้าง</th>
                <th style="width: 80px;">วันที่เสร็จ</th>
                <th style="width: 50px;">รูปภาพ</th>
            </tr>
        </thead>
        <tbody>
            ${exportData
              .map(
                (repair) => `
                <tr>
                    <td class="nowrap center">REP-${repair.id
                      .toString()
                      .padStart(5, "0")}</td>
                    <td><strong>${(repair.title || "")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")}</strong></td>
                    <td class="description">${(repair.description || "")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .substring(0, 100)}${
                  repair.description?.length > 100 ? "..." : ""
                }</td>
                    <td class="center">
                        <span class="status-${repair.status}">${getStatusText(
                  repair.status
                )}</span>
                    </td>
                    <td class="center">
                        <span class="priority-${
                          repair.priority
                        }">${getPriorityText(repair.priority)}</span>
                    </td>
                    <td>${(repair.location || "")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")}</td>
                    <td class="center">${repair.category_name || "ไม่ระบุ"}</td>
                    <td>${repair.requester_name || "ไม่ระบุ"}</td>
                    <td class="center">${
                      repair.assigned_name || "<em>ยังไม่มอบหมาย</em>"
                    }</td>
                    <td class="nowrap center">${new Date(
                      repair.created_at
                    ).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}</td>
                    <td class="nowrap center">${
                      repair.completed_at
                        ? new Date(repair.completed_at).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                        : "-"
                    }</td>
                    <td class="center">${repair.image_path ? "✅" : "❌"}</td>
                </tr>
            `
              )
              .join("")}
        </tbody>
    </table>
    
    <div class="footer">
        <p>📄 รายงานนี้สร้างโดยระบบแจ้งซ่อม | รวม ${exportData.length.toLocaleString(
          "th-TH"
        )} รายการ</p>
        <p>สร้างเมื่อ: ${new Date().toLocaleString("th-TH")}</p>
        <p><strong>หมายเหตุ:</strong> ข้อมูลนี้แสดงรายการแจ้งซ่อม${getViewModeText(
          activeView
        )}ในระบบ</p>
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], {
        type: "application/vnd.ms-excel;charset=utf-8",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      const fileName = `รายงานการแจ้งซ่อม_${getViewModeText(
        activeView
      )}_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.xls`;
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`ส่งออกรายงาน ${exportData.length} รายการสำเร็จ! 📊`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  };

  const getViewModeText = (view) => {
    switch (view) {
      case "active":
        return "รายการที่ยังดำเนินการ";
      case "completed":
        return "รายการที่เสร็จสิ้นแล้ว";
      default:
        return "ทั้งหมด";
    }
  };

  const getFilteredCount = (status) => {
    return filteredRepairsByView.filter((r) => r.status === status).length;
  };

  const getDateRangeText = (range) => {
    const rangeMap = {
      all: "ทั้งหมด",
      today: "วันนี้",
      week: "7 วันที่ผ่านมา",
      month: "30 วันที่ผ่านมา",
      quarter: "90 วันที่ผ่านมา",
    };
    return rangeMap[range] || "ทั้งหมด";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />;
      case "assigned":
        return <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "รอดำเนินการ",
      assigned: "มอบหมายแล้ว",
      in_progress: "กำลังดำเนินการ",
      completed: "เสร็จสิ้น",
      cancelled: "ยกเลิก",
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status) => {
    const badgeMap = {
      pending: "bg-orange-100 text-orange-800 border-orange-200",
      assigned: "bg-purple-100 text-purple-800 border-purple-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return badgeMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityText = (priority) => {
    const priorityMap = {
      low: "ต่ำ",
      medium: "ปานกลาง",
      high: "สูง",
      urgent: "เร่งด่วน",
    };
    return priorityMap[priority] || priority;
  };

  const getPriorityBadge = (priority) => {
    const badgeMap = {
      low: "bg-gray-100 text-gray-800 border-gray-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      urgent: "bg-red-100 text-red-800 border-red-200",
    };
    return badgeMap[priority] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const canEdit = (repair) => {
    if (user?.role === "admin" || user?.role === "technician") {
      return true;
    }

    if (user?.role === "user") {
      return repair.requester_id === user.id && repair.status === "pending";
    }

    return false;
  };

  // Filter repairs by view mode
  const filteredRepairsByView = repairs.filter((repair) => {
    if (activeView === "active") {
      return repair.status !== "completed" && repair.status !== "cancelled";
    } else if (activeView === "completed") {
      return repair.status === "completed" || repair.status === "cancelled";
    }
    return true; // 'all' view
  });

  const filteredRepairs = filteredRepairsByView.filter((repair) => {
    const matchesSearch =
      searchTerm === "" ||
      repair.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.assigned_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || repair.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || repair.priority === priorityFilter;
    const matchesCategory =
      categoryFilter === "all" || repair.category_id == categoryFilter;

    let matchesTechnician = true;
    if (technicianFilter !== "all") {
      if (technicianFilter === "unassigned") {
        matchesTechnician = !repair.assigned_to;
      } else {
        matchesTechnician = repair.assigned_to == technicianFilter;
      }
    }

    let matchesDateRange = true;
    if (dateRangeFilter !== "all") {
      const now = new Date();
      const repairDate = new Date(repair.created_at);
      let startDate;

      switch (dateRangeFilter) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          matchesDateRange = repairDate >= startDate;
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = repairDate >= startDate;
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateRange = repairDate >= startDate;
          break;
        case "quarter":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          matchesDateRange = repairDate >= startDate;
          break;
      }
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesCategory &&
      matchesTechnician &&
      matchesDateRange
    );
  });

  const filteredAndSortedRepairs = [...filteredRepairs].sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case "created_at":
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case "priority":
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
        break;
      case "status":
        const statusOrder = {
          pending: 1,
          assigned: 2,
          in_progress: 3,
          completed: 4,
          cancelled: 5,
        };
        aValue = statusOrder[a.status] || 0;
        bValue = statusOrder[b.status] || 0;
        break;
      case "title":
        aValue = a.title?.toLowerCase() || "";
        bValue = b.title?.toLowerCase() || "";
        break;
      default:
        aValue = a[sortField] || "";
        bValue = b[sortField] || "";
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRepairs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRepairs = filteredAndSortedRepairs.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Mobile Header Content
  const mobileHeaderContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="md:hidden flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <Filter className="w-4 h-4 mr-1" />
          ตัวกรอง
        </button>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3 h-3 sm:w-4 sm:h-4 ${isMobile ? "" : "mr-1"} ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          {!isMobile && "รีเฟรช"}
        </button>

        {filteredAndSortedRepairs.length > 0 && (
          <button
            onClick={exportToExcel}
            className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <FileSpreadsheet
              className={`w-3 h-3 sm:w-4 sm:h-4 ${isMobile ? "" : "mr-1"}`}
            />
            {!isMobile && "Excel"}
          </button>
        )}
      </div>

      <Link
        to="/repairs/new"
        className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
      >
        <Plus className="w-3 h-3 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
        {isMobile ? "แจ้งซ่อม" : "แจ้งซ่อมใหม่"}
      </Link>
    </div>
  );

  // Desktop Header Content
  const desktopHeaderContent = (
    <div className="hidden md:flex items-center space-x-3">
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

      {filteredAndSortedRepairs.length > 0 && (
        <button
          onClick={exportToExcel}
          className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1" />
          ส่งออก Excel
        </button>
      )}

      <div className="flex items-center space-x-1">
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === "list"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === "grid"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
      </div>

      <Link
        to="/repairs/new"
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        แจ้งซ่อมใหม่
      </Link>
    </div>
  );

  if (loading) {
    return (
      <Layout title="รายการแจ้งซ่อม">
        <div className="flex items-center justify-center h-32 sm:h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">
              กำลังโหลดข้อมูล...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Card Component for Grid View
  const RepairCard = ({ repair }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon(repair.status)}
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(
              repair.status
            )}`}
          >
            {getStatusText(repair.status)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(
              repair.priority
            )}`}
          >
            {getPriorityText(repair.priority)}
          </span>
          {repair.image_path && <ImageIcon className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {repair.title}
      </h4>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {repair.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs sm:text-sm text-gray-500">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{repair.location}</span>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-gray-500">
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{repair.requester_name || "ไม่ระบุ"}</span>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-gray-500">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
          <span>{new Date(repair.created_at).toLocaleDateString("th-TH")}</span>
        </div>
        {repair.assigned_name && (
          <div className="flex items-center text-xs sm:text-sm text-blue-600">
            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="truncate">
              ผู้รับผิดชอบ: {repair.assigned_name}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          to={`/repairs/${repair.id}`}
          className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          ดูรายละเอียด
        </Link>

        {canEdit(repair) && (
          <Link
            to={`/repairs/${repair.id}/edit`}
            className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            แก้ไข
          </Link>
        )}

        {/* Move to Completed Category Button */}
        {(user?.role === "admin" || user?.role === "technician") &&
          repair.status === "completed" && (
            <button
              onClick={() => moveToCompletedCategory(repair.id)}
              className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              title="ย้ายไป category เสร็จสิ้น"
            >
              <Archive className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              เก็บเข้าคลัง
            </button>
          )}

        {user?.role === "user" &&
          !canEdit(repair) &&
          repair.requester_id === user.id && (
            <span className="flex items-center justify-center px-3 py-2 text-xs bg-gray-100 text-gray-500 rounded-lg">
              🔒 ไม่สามารถแก้ไขได้
            </span>
          )}
      </div>
    </div>
  );

  return (
    <Layout
      title="รายการแจ้งซ่อม"
      headerContent={isMobile ? mobileHeaderContent : desktopHeaderContent}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Page Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                จัดการการแจ้งซ่อม - {getViewModeText(activeView)}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                ดูและติดตามรายการแจ้งซ่อม{activeView === "all" ? "ทั้งหมด" : ""}
                ในระบบ
                {user?.role === "user" && (
                  <span className="block text-xs sm:text-sm text-amber-600 mt-1">
                    💡 คุณสามารถแก้ไขได้เฉพาะรายการที่คุณสร้างและยังอยู่ในสถานะ
                    "รอดำเนินการ" เท่านั้น
                  </span>
                )}
              </p>
            </div>
            <div className="text-left lg:text-right text-xs sm:text-sm text-gray-500">
              <p>ผู้ใช้: {user?.full_name || user?.username}</p>
              <p>
                บทบาท:{" "}
                {user?.role === "admin"
                  ? "ผู้ดูแลระบบ"
                  : user?.role === "technician"
                  ? "ช่างเทคนิค"
                  : "ผู้ใช้งาน"}
              </p>
              <p className="text-green-600">✅ ดูได้ตามสิทธิ์</p>
            </div>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-700 mr-3">
                แสดงรายการ:
              </span>
              <button
                onClick={() => {
                  setActiveView("active");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeView === "active"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <AlertCircle className="w-4 h-4 mr-1 inline" />
                รายการที่ยังดำเนินการ
              </button>
              <button
                onClick={() => {
                  setActiveView("completed");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeView === "completed"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Archive className="w-4 h-4 mr-1 inline" />
                รายการที่เสร็จสิ้นแล้ว
              </button>
              <button
                onClick={() => {
                  setActiveView("all");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeView === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <List className="w-4 h-4 mr-1 inline" />
                ทั้งหมด
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Filters Overlay */}
        {showMobileFilters && isMobile && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={() => setShowMobileFilters(false)}
          >
            <div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl p-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">ตัวกรอง</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ค้นหา
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="ค้นหา..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">ทุกสถานะ</option>
                    <option value="pending">รอดำเนินการ</option>
                    <option value="assigned">มอบหมายแล้ว</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ความสำคัญ
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">ทุกระดับ</option>
                    <option value="urgent">เร่งด่วน</option>
                    <option value="high">สูง</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="low">ต่ำ</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมวดหมู่
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">ทุกหมวดหมู่</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ช่วงเวลา
                  </label>
                  <select
                    value={dateRangeFilter}
                    onChange={(e) => {
                      setDateRangeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">ทุกช่วงเวลา</option>
                    <option value="today">วันนี้</option>
                    <option value="week">7 วันที่ผ่านมา</option>
                    <option value="month">30 วันที่ผ่านมา</option>
                    <option value="quarter">90 วันที่ผ่านมา</option>
                  </select>
                </div>

                {/* Technician Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ผู้รับผิดชอบ
                  </label>
                  <select
                    value={technicianFilter}
                    onChange={(e) => {
                      setTechnicianFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">ทุกคน</option>
                    <option value="unassigned">ยังไม่มอบหมาย</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name} (
                        {tech.role === "admin" ? "แอดมิน" : "ช่างเทคนิค"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ล้างตัวกรอง
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ใช้ตัวกรอง
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Filters */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">ตัวกรอง</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                {showAdvancedFilters
                  ? "ซ่อนตัวกรองเพิ่มเติม"
                  : "แสดงตัวกรองเพิ่มเติม"}
              </button>
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                ล้างตัวกรอง
              </button>
            </div>
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ค้นหา... (หัวข้อ, สถานที่, ผู้แจ้ง)"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="assigned">มอบหมายแล้ว</option>
                <option value="in_progress">กำลังดำเนินการ</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">ทุกระดับ</option>
                <option value="urgent">เร่งด่วน</option>
                <option value="high">สูง</option>
                <option value="medium">ปานกลาง</option>
                <option value="low">ต่ำ</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">ทุกหมวดหมู่</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <select
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">ทุกช่วงเวลา</option>
                <option value="today">วันนี้</option>
                <option value="week">7 วันที่ผ่านมา</option>
                <option value="month">30 วันที่ผ่านมา</option>
                <option value="quarter">90 วันที่ผ่านมา</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Technician Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ผู้รับผิดชอบ
                  </label>
                  <select
                    value={technicianFilter}
                    onChange={(e) => {
                      setTechnicianFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">ทุกคน</option>
                    <option value="unassigned">ยังไม่มอบหมาย</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name} (
                        {tech.role === "admin" ? "แอดมิน" : "ช่างเทคนิค"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Filters Display */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ตัวกรองที่ใช้งาน
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activeView !== "all" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        มุมมอง: {getViewModeText(activeView)}
                        <button
                          onClick={() => setActiveView("all")}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {statusFilter !== "all" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        สถานะ: {getStatusText(statusFilter)}
                        <button
                          onClick={() => setStatusFilter("all")}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {priorityFilter !== "all" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ความสำคัญ: {getPriorityText(priorityFilter)}
                        <button
                          onClick={() => setPriorityFilter("all")}
                          className="ml-1 text-orange-600 hover:text-orange-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {categoryFilter !== "all" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        หมวดหมู่:{" "}
                        {categories.find((c) => c.id == categoryFilter)?.name}
                        <button
                          onClick={() => setCategoryFilter("all")}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {technicianFilter !== "all" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ช่าง:{" "}
                        {technicianFilter === "unassigned"
                          ? "ยังไม่มอบหมาย"
                          : technicians.find((t) => t.id == technicianFilter)
                              ?.full_name}
                        <button
                          onClick={() => setTechnicianFilter("all")}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {dateRangeFilter !== "all" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ช่วงเวลา: {getDateRangeText(dateRangeFilter)}
                        <button
                          onClick={() => setDateRangeFilter("all")}
                          className="ml-1 text-yellow-600 hover:text-yellow-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {searchTerm && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ค้นหา: "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm("")}
                          className="ml-1 text-gray-600 hover:text-gray-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  รอดำเนินการ
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {
                    filteredRepairsByView.filter((r) => r.status === "pending")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <User className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  มอบหมายแล้ว
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {
                    filteredRepairsByView.filter((r) => r.status === "assigned")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  กำลังดำเนินการ
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {
                    filteredRepairsByView.filter(
                      (r) => r.status === "in_progress"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  เสร็จสิ้น
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {
                    filteredRepairsByView.filter(
                      (r) => r.status === "completed"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 col-span-2 md:col-span-1">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {getViewModeText(activeView)}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredRepairsByView.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Repair List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {getViewModeText(activeView)} (
                  {filteredAndSortedRepairs.length.toLocaleString("th-TH")})
                </h3>
                {/* Mobile View Mode Toggle */}
                <div className="md:hidden flex items-center space-x-1 mt-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "list"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "grid"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-gray-600">
                  เรียงตาม:
                </span>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <button
                    onClick={() => handleSort("created_at")}
                    className={`flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                      sortField === "created_at"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    วันที่
                    {sortField === "created_at" &&
                      (sortOrder === "asc" ? (
                        <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      ) : (
                        <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      ))}
                  </button>
                  <button
                    onClick={() => handleSort("priority")}
                    className={`flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                      sortField === "priority"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    ความสำคัญ
                    {sortField === "priority" &&
                      (sortOrder === "asc" ? (
                        <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      ) : (
                        <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      ))}
                  </button>
                  <button
                    onClick={() => handleSort("status")}
                    className={`flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                      sortField === "status"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    สถานะ
                    {sortField === "status" &&
                      (sortOrder === "asc" ? (
                        <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      ) : (
                        <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      ))}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            {(statusFilter !== "all" ||
              priorityFilter !== "all" ||
              categoryFilter !== "all" ||
              technicianFilter !== "all" ||
              dateRangeFilter !== "all" ||
              searchTerm ||
              activeView !== "all") && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>ผลการกรอง:</strong> แสดง{" "}
                  {filteredAndSortedRepairs.length.toLocaleString("th-TH")}{" "}
                  รายการ จาก {getViewModeText(activeView)}{" "}
                  {filteredRepairsByView.length.toLocaleString("th-TH")} รายการ
                  {(filteredAndSortedRepairs.length !==
                    filteredRepairsByView.length ||
                    activeView !== "all") && (
                    <button
                      onClick={() => {
                        clearAllFilters();
                        setActiveView("all");
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      แสดงทั้งหมด
                    </button>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Content Area */}
          {currentRepairs.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500 mb-2">
                {searchTerm ||
                statusFilter !== "all" ||
                priorityFilter !== "all" ||
                categoryFilter !== "all" ||
                technicianFilter !== "all" ||
                dateRangeFilter !== "all"
                  ? `ไม่พบรายการในหมวด "${getViewModeText(
                      activeView
                    )}" ที่ตรงกับเงื่อนไขการค้นหา`
                  : `ไม่มีรายการใน "${getViewModeText(activeView)}"`}
              </p>
              {searchTerm ||
              statusFilter !== "all" ||
              priorityFilter !== "all" ||
              categoryFilter !== "all" ||
              technicianFilter !== "all" ||
              dateRangeFilter !== "all" ? (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  ล้างตัวกรองทั้งหมด
                </button>
              ) : (
                <Link
                  to="/repairs/new"
                  className="inline-flex items-center mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  สร้างรายการแรก
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === "grid" ? (
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {currentRepairs.map((repair) => (
                      <RepairCard key={repair.id} repair={repair} />
                    ))}
                  </div>
                </div>
              ) : (
                /* List View */
                <div className="divide-y divide-gray-200">
                  {currentRepairs.map((repair) => (
                    <div
                      key={repair.id}
                      className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
                            {getStatusIcon(repair.status)}
                            <h4 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                              {repair.title}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(
                                repair.status
                              )}`}
                            >
                              {getStatusText(repair.status)}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(
                                repair.priority
                              )}`}
                            >
                              {getPriorityText(repair.priority)}
                            </span>
                            {repair.image_path && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                <ImageIcon className="w-3 h-3 mr-1" />
                                รูปภาพ
                              </span>
                            )}
                          </div>

                          <p className="text-sm sm:text-base text-gray-600 mb-3 line-clamp-2">
                            {repair.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center min-w-0">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {repair.location}
                              </span>
                            </div>
                            {repair.category_name && (
                              <div className="flex items-center">
                                <span className="text-gray-400">หมวดหมู่:</span>
                                <span className="ml-1 font-medium">
                                  {repair.category_name}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center min-w-0">
                              <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {repair.requester_name || "ไม่ระบุ"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                              <span>
                                {new Date(repair.created_at).toLocaleDateString(
                                  "th-TH",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                            {repair.assigned_name && (
                              <div className="flex items-center min-w-0">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                                <span className="text-gray-400">
                                  ผู้รับผิดชอบ:
                                </span>
                                <span className="ml-1 font-medium truncate">
                                  {repair.assigned_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col gap-2 sm:ml-4">
                          <Link
                            to={`/repairs/${repair.id}`}
                            className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            ดูรายละเอียด
                          </Link>

                          {canEdit(repair) && (
                            <Link
                              to={`/repairs/${repair.id}/edit`}
                              className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors whitespace-nowrap"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              แก้ไข
                            </Link>
                          )}

                          {user?.role === "user" &&
                            !canEdit(repair) &&
                            repair.requester_id === user.id && (
                              <span className="flex items-center justify-center px-3 py-2 text-xs bg-gray-100 text-gray-500 rounded-lg whitespace-nowrap">
                                🔒 ไม่สามารถแก้ไขได้
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  แสดง {(startIndex + 1).toLocaleString("th-TH")}-
                  {Math.min(
                    endIndex,
                    filteredAndSortedRepairs.length
                  ).toLocaleString("th-TH")}{" "}
                  จาก {filteredAndSortedRepairs.length.toLocaleString("th-TH")}{" "}
                  รายการ
                </div>
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ก่อนหน้า
                  </button>

                  {/* Mobile Pagination - Show only current page and total */}
                  {isMobile ? (
                    <span className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg">
                      {currentPage} / {totalPages}
                    </span>
                  ) : (
                    /* Desktop Pagination - Show page numbers */
                    [...Array(totalPages)].map((_, index) => {
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
                            className={`px-3 py-2 text-sm rounded-lg ${
                              page === currentPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        (page === currentPage - 3 && currentPage > 4) ||
                        (page === currentPage + 3 &&
                          currentPage < totalPages - 3)
                      ) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RepairList;
