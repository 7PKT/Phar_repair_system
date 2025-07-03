-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 03, 2025 at 06:32 AM
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
(1, 'admin', 'admin@test.com', '$2b$10$9wzrqtrGA185wB14FZBSturfKIQpCHGUDvuYQXMP8O0lkqLFTMV8q', 'Admin', NULL, 'admin', '2025-06-19 06:22:38', '2025-07-03 03:33:00', '2025-07-03 03:33:00'),
(2, 'tech', 'Tech@test.com', '$2b$10$wuWgRwX0R03wK4FC3bTTEumQLXVZ6G5adra/BDq1833U8DR/J2sNe', 'Tech', '1233445566', 'technician', '2025-06-24 07:36:31', '2025-07-02 03:25:19', '2025-07-02 03:25:19'),
(3, 'user', 'user@test.com', '$2a$12$g7vG8PhLhXKptRaQmJ7ZEOUMUX.H0hnhSIKkM5JqWZ3quOsMLcCVW', 'User', NULL, 'user', '2025-06-19 06:22:38', '2025-06-30 07:43:34', '2025-06-30 07:43:34');

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
  ADD KEY `idx_created_at` (`created_at`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `repair_requests`
--
ALTER TABLE `repair_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `status_history`
--
ALTER TABLE `status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=533;

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
