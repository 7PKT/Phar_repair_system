-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 25, 2025 at 11:33 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `repair_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'ไฟฟ้า', 'ปัญหาเกี่ยวกับระบบไฟฟ้า', '2025-06-19 04:01:12'),
(2, 'ประปา', 'ปัญหาเกี่ยวกับระบบประปา', '2025-06-19 04:01:12'),
(3, 'แอร์', 'ปัญหาเกี่ยวกับเครื่องปรับอากาศ', '2025-06-19 04:01:12'),
(4, 'คอมพิวเตอร์', 'ปัญหาเกี่ยวกับอุปกรณ์คอมพิวเตอร์', '2025-06-19 04:01:12'),
(5, 'อื่นๆ', 'ปัญหาอื่นๆ', '2025-06-19 04:01:12');

-- --------------------------------------------------------

--
-- Table structure for table `completion_images`
--

CREATE TABLE `completion_images` (
  `id` int(11) NOT NULL,
  `repair_request_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_size` int(11) DEFAULT 0,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `repair_images`
--

CREATE TABLE `repair_images` (
  `id` int(11) NOT NULL,
  `repair_request_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_size` int(11) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บรูปภาพหลายรูปสำหรับการแจ้งซ่อมแต่ละรายการ';

--
-- Dumping data for table `repair_images`
--

INSERT INTO `repair_images` (`id`, `repair_request_id`, `file_path`, `file_name`, `file_size`, `uploaded_at`) VALUES
(1, 1, 'uploads/repair-images/repair-1752735802054-727149495.PNG', 'Capture.PNG', 203081, '2025-07-17 07:03:22'),
(2, 2, 'uploads/repair-images/repair-1752737140162-237246520.jpg', 'ai-generated-picture-of-a-tiger-walking-in-the-forest-photo.jpg', 13348, '2025-07-17 07:25:40'),
(3, 3, 'uploads/repair-images/repair-1752808587291-513070188.png', '13971546034058.png', 532353, '2025-07-18 03:16:27'),
(5, 5, 'uploads/repair-images/repair-1753243949716-400517846.jpg', 'free-nature-images.jpg', 200951, '2025-07-23 04:12:29');

-- --------------------------------------------------------

--
-- Table structure for table `repair_requests`
--

CREATE TABLE `repair_requests` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `location` varchar(200) NOT NULL,
  `building_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('pending','assigned','in_progress','completed','cancelled') DEFAULT 'pending',
  `completion_details` text DEFAULT NULL,
  `requester_id` int(11) NOT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `repair_requests`
--

INSERT INTO `repair_requests` (`id`, `title`, `description`, `category_id`, `location`, `building_id`, `room_id`, `priority`, `status`, `completion_details`, `requester_id`, `assigned_to`, `image_path`, `created_at`, `updated_at`, `completed_at`) VALUES
(1, 'ไฟไหม้', 'ไฟไหม้ ห้องดำไปหมดเลย', 1, 'อาคาร 5 ชั้น 2 ปฏิบัติการกลางเทคโนโลยีเภสัชกรรม', NULL, NULL, 'medium', 'assigned', '', 1, 2, NULL, '2025-07-17 07:03:22', '2025-07-18 09:21:56', NULL),
(2, 'เสือหลุด', 'เสือหลุดออกมาจกกรง', 5, 'อาคาร 2 ชั้น 2 เครื่องมือกลาง', NULL, NULL, 'high', 'in_progress', '', 3, 2, NULL, '2025-07-17 07:25:40', '2025-07-18 09:19:10', NULL),
(3, 'ไฟไหม้', 'ไฟไหม้ ห้องวายวอดด', 1, 'อาคาร 1 ชั้น 3 เฟื่องฟ้า', NULL, NULL, 'high', 'pending', '', 1, NULL, NULL, '2025-07-18 03:16:27', '2025-07-18 09:20:46', NULL),
(4, 'น้ำท่วม', 'น้ำท่วงแทงค์', 2, 'อาคาร 1 ชั้น 3 ห้องเฟื่องฟ้า 3', NULL, NULL, 'urgent', 'pending', NULL, 1, NULL, NULL, '2025-07-21 04:14:32', '2025-07-21 04:35:29', NULL),
(5, 'ดไำเำพ่ร้ไีรำรี้น่ย่ยๆ่ไอรเัๆดหัดๆะewifjowheuigyuwfgre', 'fwefregergrtfe', 2, 'อาคาร 12 ชั้น 3 ห้องตัวอย่างชั้น 3', NULL, NULL, 'high', 'pending', NULL, 1, NULL, NULL, '2025-07-23 04:12:29', '2025-07-23 04:12:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `building` int(11) NOT NULL,
  `floor` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `name`, `building`, `floor`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ห้องการเงิน การคลังและพัสดุ', 1, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(2, 'ห้องโถงบริการการศึกษา', 1, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(3, 'ห้องงานบริการการศึกษา', 1, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(4, 'ห้องพักอาจารย์ 1', 1, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-21 04:15:05'),
(5, 'ห้องพักอาจารย์ 14', 1, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(6, 'ห้อง Counselling', 1, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(7, 'ห้องพักอาจารย์ 15', 1, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(8, 'ห้องพวงคราม', 1, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(9, 'ห้องพักอาจารย์ 11', 1, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(10, 'ห้องเฟื่องฟ้า1', 1, 3, 'ดาดฟ้า', 1, '2025-07-17 08:11:09', '2025-07-21 04:15:34'),
(11, 'ห้องเฟื่องฟ้า2', 1, 3, 'ดาดฟ้า', 1, '2025-07-17 08:11:09', '2025-07-21 04:15:39'),
(12, 'ห้องเฟื่องฟ้า 3', 1, 3, 'ดาดฟ้า', 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(13, 'ห้องเครื่องสำอางค์', 2, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(14, 'ห้องปฏิบัติการจุลวิทยา 1', 2, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(15, 'ห้องปฏิบัติการจุลวิทยา 2', 2, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(16, 'ห้องปฏิบัติการจุลวิทยา 3', 2, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(18, 'ห้องเครื่องมือกลาง 2', 2, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 07:35:01'),
(25, 'ห้องบรรยายผักหวาน (308)', 2, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(26, 'ห้องพักอาจารย์ 6', 2, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(27, 'ห้องปฏิบัติการยาเม็ด 1', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(28, 'ห้องปฏิบัติการยาเม็ด 2', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(29, 'ห้องปฏิบัติการยาเม็ด 3', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(30, 'ห้องปฏิบัติการยาเม็ด 4', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(31, 'ห้องปฏิบัติการยาเม็ด 5', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(32, 'ห้องปฏิบัติการยาเม็ด 6', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(33, 'ห้องปฏิบัติการยาเม็ด 7', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(34, 'ห้องปฏิบัติการยาเม็ด 8', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(35, 'ห้องปฏิบัติการยาเม็ด 9', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(36, 'ห้องปฏิบัติการยาเม็ด 10', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(37, 'ห้องปฏิบัติการและวิจัย เภสัชเคมี 1', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(38, 'ห้องปฏิบัติการและวิจัย เภสัชเคมี 2', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(39, 'ห้องปฏิบัติการและวิจัย เภสัชเคมี 3', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(40, 'ห้องปฏิบัติการและวิจัย เภสัชเคมี 4', 3, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(41, 'ห้องบรรยายผักเสี้ยว (212)', 3, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(42, 'ห้องปฏิบัติการเภสัชเคมี 1', 3, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(43, 'ห้องปฏิบัติการเภสัชเคมี 2', 3, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:08'),
(44, 'ห้องปฏิบัติการเภสัชเคมี 3', 3, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(45, 'ห้องปฏิบัติการเภสัชเคมี 4', 3, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(46, 'ห้องปฏิบัติการเภสัชเคมี 5', 3, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(47, 'ห้องปฏิบัติการเภสัชเคมี 6', 3, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(48, 'ห้องปฏิบัติการเภสัชเคมี 7', 3, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(49, 'ห้องปฏิบัติการเภสัชเคมี 8', 3, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(50, 'ห้องปฏิบัติการกลางภาคบริบาล (ห้องไบโอ)', 3, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(51, 'ห้องเก็บสารเคมี (อาจารย์ไชยวัฒน์)', 3, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(52, 'ห้องเลี้ยงเซลล์', 3, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(53, 'ห้องประชุม 6', 3, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(54, 'ห้องพักอาจารย์ไชยวัฒน์', 3, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(55, 'ห้องปฏิบัติการเภสัชเคมี', 3, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 07:38:37'),
(59, 'ห้องพักอาจารย์ 4', 3, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(60, 'ห้องบรรยายผักแว่น (401)', 3, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:10'),
(61, 'ห้องพักอาจารย์ 5', 3, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:10'),
(62, 'ศูนย์นวัตกรรมสุขภาพองค์รวมโภชน์เภสัชภัณฑ์ 1', 3, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(63, 'ศูนย์นวัตกรรมสุขภาพองค์รวมโภชน์เภสัชภัณฑ์ 2', 3, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(64, 'ศูนย์นวัตกรรมสุขภาพองค์รวมโภชน์เภสัชภัณฑ์ 3', 3, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(65, 'ศูนย์นวัตกรรมสุขภาพองค์รวมโภชน์เภสัชภัณฑ์ 4', 3, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:09'),
(66, 'ห้องปฏิบัติการ', 3, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:10'),
(67, 'ห้องเครื่องมือกลาง 3', 3, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 07:39:27'),
(75, 'ห้องดนตรี', 3, 5, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 03:37:10'),
(76, 'ห้องปฏิบัติการชั้น 5', 3, 5, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 07:39:52'),
(87, 'ห้องใต้ดินหน่วยอาคาร', 4, 0, 'ใต้ดิน', 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(88, 'งานบริหารงานทั่วไป', 4, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(89, 'งานนโยบายและแผน', 4, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(90, 'งานบริหารงานวิจัยและวิเทศน์สัมพันธ์', 4, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(91, 'ห้องพักอาจารย์ 10', 4, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(92, 'ห้องภาควิชาบริบาลเภสัชกรรม', 4, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(93, 'ห้องเขียวมะกอก', 4, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(94, 'ภาควิชาวิทยาศาสตร์เภสัชกรรม', 4, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(95, 'พิพัธภัณฑ์สมุนไพร', 4, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(96, 'ห้องร้านขายยาสมุนไพร (หอมไกล)', 4, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(97, 'สำนักงานคณบดี', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(98, 'ห้องผู้ช่วยคณบดี', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(99, 'ห้องประชุม 1', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(100, 'ห้องประชุม 2', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(101, 'ห้องประชุม 3', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(102, 'ห้องประชุม 4', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(103, 'ห้องประชุม 5', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(104, 'ห้องออนไลน์ 1', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(105, 'ห้องออนไลน์ 2', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(106, 'ห้องออนไลน์ 3', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(107, 'ห้องออนไลน์ 4', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(108, 'หน่วย IT และ ห้องควบคุม Server', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(109, 'ห้องเพาะเลี้ยงเนื้อเยื่อ', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(110, 'หน่วยฝึกงานและพัฒนาวิชาชีพ', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(111, 'ห้องพุดซ้อน 1', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(112, 'ห้องพุดซ้อน 2', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(113, 'ห้องพุดซ้อน 3', 4, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(114, 'ห้องพุทธชาด', 4, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(115, 'ห้อง PCTC ศูนย์ฝึกอบรมบริบาลเภสัชกรรม', 4, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(116, 'ห้องสมุด', 4, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(117, 'ห้องศูนย์นวัตกรรมสมุนไพร', 4, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(118, 'ห้องปฏิบัติการ เภสัชเวท', 4, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(119, 'ห้องบัณฑิต 1', 4, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(120, 'ห้องราชาวดี', 4, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(121, 'ห้องสุนทรี (ห้องเก็บของข้างห้องสสี)', 4, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(122, 'ห้องพักอาจารย์ 9', 4, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(123, 'ห้องพุทธรักษา', 4, 4, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(124, 'ห้องเครื่องมือกลาง 1', 4, 5, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(125, 'ห้องพุดตาล', 4, 5, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(126, 'ห้องประชุมสสี', 4, 5, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(127, 'ห้องเครื่องลิฟท์หน้าภาคบริบาลฯ', 4, 6, 'ดาดฟ้า', 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(128, 'ห้องเครื่องลิฟท์หน้าภาควิทย์ฯ', 4, 6, 'ดาดฟ้า', 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(129, 'ห้อง Derm X', 5, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(130, 'ห้องระบาด', 5, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(131, 'ห้องพักบัณฑิต 2', 5, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(132, 'ห้องปฏิบัติการกลางเทคโนโลยีเภสัชกรรม', 5, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(133, 'ห้องปฏิบัติ (Lab นักศึกษา)', 5, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(134, 'ห้องพักอาจารย์ 8', 5, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(135, 'ห้องปฏิบัติการกลางทางเทคโนโลยี ฯ', 5, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(136, 'ห้องปฏิบัติการ (เครื่องสำอางค์)', 5, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(137, 'ห้องปฏิบัติการ', 5, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 07:43:17'),
(138, 'ห้องวิจัยเลี้ยงเซลล์ 2', 5, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(139, 'ห้องเครื่องมือ (ห้องขัดผิว)', 5, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(140, 'ห้องเครื่องมือ', 5, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(141, 'ห้องพักอาจารย์ 2', 5, 3, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(142, 'ห้องพักอาจารย์ 7', 6, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 07:43:48'),
(148, 'Co-working space ', 6, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-22 07:44:25'),
(155, 'ห้องบรรยายกระถินณรงค์', 6, 2, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(156, 'ห้องฏิบัติการยาฉีด', 7, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(157, 'โรงงานเครื่องสำอางค์ 1', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(158, 'โรงงานเครื่องสำอางค์ 2', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(159, 'โรงงานเครื่องสำอางค์ 3', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(160, 'โรงงานเครื่องสำอางค์ 4', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(161, 'โรงงานเครื่องสำอางค์ 5', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(162, 'โรงงานเครื่องสำอางค์ 6', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(163, 'โรงงานเครื่องสำอางค์ 7', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(164, 'โรงงานเครื่องสำอางค์ 8', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(165, 'โรงงานเครื่องสำอางค์ 9', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(166, 'โรงงานเครื่องสำอางค์ 10', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(167, 'โรงงานเครื่องสำอางค์ 11', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(168, 'โรงงานเครื่องสำอางค์ 12', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(169, 'โรงงานเครื่องสำอางค์ 13', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(170, 'โรงงานเครื่องสำอางค์ 14', 8, 1, NULL, 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(171, 'หอพระด้านหน้า', 9, 1, 'หน้าคณะ', 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(172, 'หอพักนักศึกษา', 9, 1, 'หอพัก', 1, '2025-07-17 08:11:09', '2025-07-17 08:11:09'),
(173, 'ห้องตัวอย่าง', 11, 1, 'ห้องตัวอย่างสำหรับ11', 0, '2025-07-21 09:20:46', '2025-07-22 07:22:23'),
(174, 'ห้องตัวอย่างชั้น 5', 2, 5, 'ห้องตัวอย่างสำหรับชั้น 5', 1, '2025-07-22 03:07:53', '2025-07-22 03:07:53'),
(175, 'ห้องตัวอย่างชั้น 3', 2, 3, 'ห้องตัวอย่างสำหรับชั้น 3', 1, '2025-07-22 03:18:25', '2025-07-22 03:18:25'),
(176, 'ห้องตัวอย่าง', 100, 1, 'ห้องตัวอย่างสำหรับ100', 0, '2025-07-22 03:37:22', '2025-07-22 07:22:18'),
(178, 'ห้องชั้น10 ใหม่', 10, 1, 'ห้องตัวอย่างสำหรับอาคาร 10', 1, '2025-07-22 07:48:53', '2025-07-22 07:49:40'),
(179, 'ห้องตัวอย่างชั้น 2', 9, 2, 'ห้องตัวอย่างสำหรับชั้น 2', 1, '2025-07-22 08:34:50', '2025-07-22 08:34:50'),
(180, 'ห้องตัวอย่างชั้น 3', 9, 3, 'ห้องตัวอย่างสำหรับชั้น 3', 1, '2025-07-22 08:34:52', '2025-07-22 08:34:52'),
(181, 'ห้อง12 อาคารใหม่', 12, 1, 'ห้องตัวอย่างสำหรับอาคาร 12', 1, '2025-07-23 04:11:13', '2025-07-23 04:11:51'),
(182, 'ห้องตัวอย่างชั้น 2', 12, 2, 'ห้องตัวอย่างสำหรับชั้น 2', 1, '2025-07-23 04:11:19', '2025-07-23 04:11:19'),
(183, 'ห้องตัวอย่างชั้น 3', 12, 3, 'ห้องตัวอย่างสำหรับชั้น 3', 1, '2025-07-23 04:11:22', '2025-07-23 04:11:22');

-- --------------------------------------------------------

--
-- Table structure for table `status_history`
--

CREATE TABLE `status_history` (
  `id` int(11) NOT NULL,
  `repair_request_id` int(11) NOT NULL,
  `old_status` enum('pending','assigned','in_progress','completed','cancelled') DEFAULT NULL,
  `new_status` enum('pending','assigned','in_progress','completed','cancelled') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `updated_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completion_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`completion_images`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `status_history`
--

INSERT INTO `status_history` (`id`, `repair_request_id`, `old_status`, `new_status`, `notes`, `updated_by`, `created_at`, `completion_images`) VALUES
(1, 1, 'pending', 'assigned', NULL, 1, '2025-07-17 07:23:27', NULL),
(2, 2, 'pending', 'in_progress', NULL, 1, '2025-07-17 07:26:49', NULL),
(3, 3, 'pending', 'pending', NULL, 1, '2025-07-18 03:17:38', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `is_sensitive` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_sensitive`, `created_at`, `updated_at`) VALUES
(1, 'line_channel_access_token', 'bkIG1WDD83IHJKua7Ayeh+5r2XfJywrCGkJzYn/xdPj3hGslOetmPXKtVKkoLDS1YSxacNSaA3KmwY1VD0qLSDSVrA4KLzklDhW0ZvATF5+eDVtu9fcaHWu+E+8lotC30WvJ1J9rBN+w19QWovINSAdB04t89/1O/w1cDnyilFU=', 'string', 'LINE Channel Access Token สำหรับส่งข้อความ', 1, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(2, 'line_channel_secret', '4f29a2a6361743a51f88d346e497b50e', 'string', 'LINE Channel Secret สำหรับยืนยันตัวตน', 1, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(3, 'line_group_id', 'C8a6a7f9b1438f91ed4ef9721d2c0cd2a', 'string', 'LINE Group ID หรือ Room ID สำหรับส่งแจ้งเตือน', 0, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(4, 'line_notifications_enabled', 'true', 'boolean', 'เปิด/ปิดการแจ้งเตือนผ่าน LINE', 0, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(5, 'line_webhook_url', '', 'string', 'URL สำหรับรับ Webhook จาก LINE', 0, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(6, 'system_name', 'ระบบแจ้งซ่อม', 'string', 'ชื่อระบบ', 0, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(7, 'admin_email', '', 'string', 'อีเมลผู้ดูแลระบบ', 0, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(8, 'notification_new_repair', 'true', 'boolean', 'แจ้งเตือนเมื่อมีการแจ้งซ่อมใหม่', 0, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(9, 'notification_status_update', 'true', 'boolean', 'แจ้งเตือนเมื่อมีการอัพเดทสถานะ', 0, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(10, 'max_image_size_mb', '5', 'number', 'ขนาดไฟล์รูปภาพสูงสุด (MB)', 0, '2025-07-02 04:18:43', '2025-07-02 09:24:53'),
(11, 'max_images_per_request', '50', 'number', 'จำนวนรูปภาพสูงสุดต่อการแจ้งซ่อม', 0, '2025-07-02 04:18:43', '2025-07-02 09:24:53');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','technician','user') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `role`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'admin', 'admin@test.com', '$2b$10$9wzrqtrGA185wB14FZBSturfKIQpCHGUDvuYQXMP8O0lkqLFTMV8q', 'Admin', NULL, 'admin', '2025-06-19 06:22:38', '2025-07-23 03:48:49', '2025-07-23 03:48:49'),
(2, 'tech', 'Tech@test.com', '$2b$10$wuWgRwX0R03wK4FC3bTTEumQLXVZ6G5adra/BDq1833U8DR/J2sNe', 'Tech', '1233445566', 'technician', '2025-06-24 07:36:31', '2025-07-22 03:08:47', '2025-07-22 03:08:47'),
(3, 'user', 'user@test.com', '$2a$12$g7vG8PhLhXKptRaQmJ7ZEOUMUX.H0hnhSIKkM5JqWZ3quOsMLcCVW', 'User', NULL, 'user', '2025-06-19 06:22:38', '2025-07-17 07:24:44', '2025-07-17 07:24:44');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `completion_images`
--
ALTER TABLE `completion_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `repair_request_id` (`repair_request_id`);

--
-- Indexes for table `repair_images`
--
ALTER TABLE `repair_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_repair_request_id` (`repair_request_id`);

--
-- Indexes for table `repair_requests`
--
ALTER TABLE `repair_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `requester_id` (`requester_id`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_building_id` (`building_id`),
  ADD KEY `idx_room_id` (`room_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_building_floor` (`building`,`floor`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_building_floor_name` (`building`,`floor`,`name`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `status_history`
--
ALTER TABLE `status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `repair_request_id` (`repair_request_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_setting_key` (`setting_key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `completion_images`
--
ALTER TABLE `completion_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `repair_images`
--
ALTER TABLE `repair_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `repair_requests`
--
ALTER TABLE `repair_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=184;

--
-- AUTO_INCREMENT for table `status_history`
--
ALTER TABLE `status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=743;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `completion_images`
--
ALTER TABLE `completion_images`
  ADD CONSTRAINT `completion_images_ibfk_1` FOREIGN KEY (`repair_request_id`) REFERENCES `repair_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `repair_images`
--
ALTER TABLE `repair_images`
  ADD CONSTRAINT `repair_images_ibfk_1` FOREIGN KEY (`repair_request_id`) REFERENCES `repair_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `repair_requests`
--
ALTER TABLE `repair_requests`
  ADD CONSTRAINT `repair_requests_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `repair_requests_ibfk_2` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `repair_requests_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `status_history`
--
ALTER TABLE `status_history`
  ADD CONSTRAINT `status_history_ibfk_1` FOREIGN KEY (`repair_request_id`) REFERENCES `repair_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `status_history_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
