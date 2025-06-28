-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 25, 2025 at 11:07 AM
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
(1, 8, 'uploads\\repair-images\\repair-1750751787601-944826065.png', 'com.png', 100726, '2025-06-24 07:56:27'),
(2, 8, 'uploads\\repair-images\\repair-1750751787605-646877867.png', 'com.png', 100726, '2025-06-24 07:56:27'),
(3, 8, 'uploads\\repair-images\\repair-1750751787621-297858250.png', 'com.png', 100726, '2025-06-24 07:56:27'),
(4, 8, 'uploads\\repair-images\\repair-1750751787622-814911750.png', 'com.png', 100726, '2025-06-24 07:56:27');

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
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
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

INSERT INTO `repair_requests` (`id`, `title`, `description`, `category_id`, `location`, `priority`, `status`, `completion_details`, `requester_id`, `assigned_to`, `image_path`, `created_at`, `updated_at`, `completed_at`) VALUES
(2, 'ๅ/-', 'ๅ/-', 1, 'ๅ/-', 'urgent', 'in_progress', 'wsdsdas', 9, 8, NULL, '2025-06-19 06:51:36', '2025-06-19 07:04:42', '2025-06-19 07:02:02'),
(3, '123', '123', 2, '123', 'medium', 'pending', NULL, 9, NULL, NULL, '2025-06-19 07:11:04', '2025-06-19 07:11:04', NULL),
(4, '123456789', 'a', 1, 'a', 'urgent', 'pending', NULL, 8, NULL, 'uploads\\repair-images\\repair-1750325582706-518848270.png', '2025-06-19 09:33:02', '2025-06-24 03:12:11', NULL),
(5, 'gbndvdfbgnghmhm', 'qwertyuiopsdfghjkl;zxcvbnm,.', 3, '1234567890-', 'urgent', 'completed', 'gyufenrtnht', 8, NULL, NULL, '2025-06-24 03:11:40', '2025-06-24 03:12:40', '2025-06-24 03:12:40'),
(6, 'เว็บแจ้งซ่อมล้ม', 'ด่วนจี้มากเลย', 4, 'ใต้ดิน', 'urgent', 'pending', NULL, 9, NULL, NULL, '2025-06-24 03:18:26', '2025-06-24 03:18:26', NULL),
(7, 'น้ำรั่ว', '................', 2, 'อาคาร 2 ชั้น 2 ห้อง 2', 'urgent', 'completed', 'ท่อ', 8, NULL, NULL, '2025-06-24 03:22:47', '2025-06-24 03:29:50', '2025-06-24 03:29:50'),
(8, 'น้ำรั่วง่วงซึม', 'น้ำรั่วง่วงซึมนอนหลับฝันดี', 2, 'อาคาร 9 ชั้น 1 ห้อง bedroom', 'urgent', 'pending', NULL, 11, NULL, NULL, '2025-06-24 07:56:27', '2025-06-24 07:56:27', NULL),
(9, 'ปแหกฟ', 'ผปแผปแผปแผแ', 1, 'อาคาร 2 ชั้น 2 ห้อง ผปแ', 'medium', 'pending', NULL, 11, NULL, NULL, '2025-06-24 08:15:34', '2025-06-24 08:15:34', NULL),
(10, 'ฟหกฟหกฟหก', 'ฟหกฟหกฟหกฟกฟห', 2, 'อาคาร 1 ชั้น 1 ห้อง ฟหกฟหกฟหก', 'high', 'pending', NULL, 11, NULL, NULL, '2025-06-24 08:15:47', '2025-06-24 08:15:47', NULL),
(11, 'ฟหกฟกฟหก', 'ฟหกฟหกกหฟกหฟ', 3, 'อาคาร 2 ชั้น 2 ห้อง ฟหกฟหก', 'high', 'pending', NULL, 11, NULL, NULL, '2025-06-24 08:16:09', '2025-06-24 08:16:09', NULL),
(12, 'หฟกฟหก', 'ฟหกฟหกฟหกกฟห', 2, 'อาคาร 2 ชั้น 1 ห้อง ฟหกฟหก', 'high', 'pending', NULL, 11, NULL, NULL, '2025-06-24 08:18:35', '2025-06-24 08:18:35', NULL),
(13, 'ฟหกฟหกฟกฟหกฟห', 'ฟหกฟหกฟกกกดหดก', 3, 'อาคาร 2 ชั้น 2 ห้อง ฟหกฟหกฟหก', 'medium', 'pending', NULL, 11, NULL, NULL, '2025-06-24 08:18:57', '2025-06-24 08:18:57', NULL),
(14, 'sadasdas', 'asdadasdadas', 1, 'อาคาร 3 ชั้น 2 ห้อง asd', 'high', 'pending', NULL, 11, NULL, NULL, '2025-06-24 08:20:56', '2025-06-24 08:20:56', NULL),
(15, 'zertyuio', 'wfghjytjrea', 3, 'อาคาร 3 ชั้น 3 ห้อง trgfb', 'high', 'pending', NULL, 11, NULL, NULL, '2025-06-24 08:21:16', '2025-06-24 08:21:16', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `status_history`
--

CREATE TABLE `status_history` (
  `id` int(11) NOT NULL,
  `repair_request_id` int(11) NOT NULL,
  `old_status` enum('pending','in_progress','completed','cancelled') DEFAULT NULL,
  `new_status` enum('pending','in_progress','completed','cancelled') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `updated_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `status_history`
--

INSERT INTO `status_history` (`id`, `repair_request_id`, `old_status`, `new_status`, `notes`, `updated_by`, `created_at`) VALUES
(5, 2, 'cancelled', 'in_progress', 'wsdsdas', 8, '2025-06-19 07:04:42'),
(6, 4, 'pending', 'pending', NULL, 8, '2025-06-24 03:12:11'),
(7, 5, 'pending', 'completed', 'gyufenrtnht', 8, '2025-06-24 03:12:40'),
(8, 7, 'pending', 'completed', 'ท่อ', 8, '2025-06-24 03:29:50'),
(9, 8, 'pending', 'pending', NULL, 8, '2025-06-25 08:53:25'),
(10, 8, 'pending', 'pending', NULL, 8, '2025-06-25 08:53:32'),
(11, 8, 'pending', 'pending', NULL, 8, '2025-06-25 08:54:00');

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
(8, 'admin', 'admin@test.com', '$2a$12$EOFs0oTrfco3FmL08W4OAugoQSzdO7OSj4KETgCNwSvP/.3dvy7fG', 'PKT', NULL, 'admin', '2025-06-19 06:22:38', '2025-06-25 08:57:12', '2025-06-25 08:57:12'),
(9, 'user', 'user@test.com', '$2a$12$g7vG8PhLhXKptRaQmJ7ZEOUMUX.H0hnhSIKkM5JqWZ3quOsMLcCVW', 'Test User naja', NULL, 'user', '2025-06-19 06:22:38', '2025-06-24 07:14:34', '2025-06-24 07:14:34'),
(11, 'Tech', 'Tech@test.com', '$2b$10$D4HF.6Spv4Rnk2.WqYaFXuFOsSjUb61dLdVQh.uGnxT8LMexYUiNO', 'Tech', NULL, 'technician', '2025-06-24 07:36:31', '2025-06-24 07:36:55', '2025-06-24 07:36:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

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
  ADD KEY `assigned_to` (`assigned_to`);

--
-- Indexes for table `status_history`
--
ALTER TABLE `status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `repair_request_id` (`repair_request_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `repair_images`
--
ALTER TABLE `repair_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `repair_requests`
--
ALTER TABLE `repair_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `status_history`
--
ALTER TABLE `status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

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
  ADD CONSTRAINT `repair_requests_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`);

--
-- Constraints for table `status_history`
--
ALTER TABLE `status_history`
  ADD CONSTRAINT `status_history_ibfk_1` FOREIGN KEY (`repair_request_id`) REFERENCES `repair_requests` (`id`),
  ADD CONSTRAINT `status_history_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
