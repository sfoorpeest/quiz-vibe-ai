SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `quizzes`;
SET FOREIGN_KEY_CHECKS = 1;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: education_quiz_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `api_logs`
--

DROP TABLE IF EXISTS `api_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `api_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_payload` text COLLATE utf8mb4_unicode_ci,
  `response_text` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `api_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_logs`
--

LOCK TABLES `api_logs` WRITE;
/*!40000 ALTER TABLE `api_logs` DISABLE KEYS */;
INSERT INTO `api_logs` VALUES (1,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":2}','Thành công: Tạo Quiz ID 2','2026-03-18 02:54:22'),(2,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":2}','Thành công: Đã tạo Quiz ID 3 với 1 câu hỏi thật.','2026-03-23 02:36:07'),(3,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":2}','Thành công: Đã tạo Quiz ID 4 với 1 câu hỏi thật.','2026-03-23 02:39:50'),(4,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":3}','Thành công: Đã tạo Quiz ID 5 với 1 câu hỏi thật.','2026-03-23 02:40:15'),(5,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":3}','Thành công: Đã tạo Quiz ID 6 với 1 câu hỏi thật.','2026-03-23 02:42:33'),(6,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":3}','Thành công: Đã tạo Quiz ID 7 với 1 câu hỏi thật.','2026-03-23 02:44:49'),(7,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":4}','Thành công: Đã tạo Quiz ID 8 với 1 câu hỏi thật.','2026-03-23 02:48:41'),(8,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":4}','Thành công: Đã tạo Quiz ID 9 với 1 câu hỏi thật.','2026-03-23 02:51:03'),(9,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":4}','Thành công: Đã tạo Quiz ID 10 với 1 câu hỏi thật.','2026-03-23 02:52:39'),(10,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":4}','Thành công: Đã tạo Quiz ID 11 với 1 câu hỏi thật.','2026-03-23 03:00:03'),(11,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":4}','Thành công: Đã tạo Quiz ID 12 với 1 câu hỏi thật.','2026-03-23 03:18:28'),(12,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":8}','Thành công: Đã tạo Quiz ID 13 với 1 câu hỏi thật.','2026-03-23 03:27:39'),(13,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":8}','Thành công: Đã tạo Quiz ID 14 với 1 câu hỏi thật.','2026-03-23 03:31:10'),(14,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":8}','Thành công: Đã tạo Quiz ID 15 với 1 câu hỏi thật.','2026-03-23 03:32:21'),(15,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":8}','Thành công: Đã tạo Quiz ID 16 với 1 câu hỏi thật.','2026-03-23 03:33:52'),(16,3,'CREATE_QUIZ_AI','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":8}','Thành công: Đã tạo Quiz ID 17 với 1 câu hỏi thật.','2026-03-23 03:35:22'),(17,3,'CREATE_QUIZ_AI_ERROR','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":8}','Lỗi: Data too long for column \'correct_answer\' at row 1','2026-03-23 03:41:51'),(18,3,'CREATE_QUIZ_AI_ERROR','{\"topic\":\"Lập trình Node.js cơ bản\",\"limit\":8}','Lỗi: Data too long for column \'correct_answer\' at row 1','2026-03-23 03:42:21'),(19,3,'CREATE_QUIZ_AI_ERROR','{\"topic\":\"số pi\",\"limit\":8}','Lỗi: Data too long for column \'correct_answer\' at row 1','2026-03-23 03:43:47'),(20,3,'CREATE_QUIZ_AI_ERROR','{\"topic\":\"số pi\",\"limit\":8}','Lỗi: Data too long for column \'correct_answer\' at row 1','2026-03-23 03:44:49'),(21,3,'CREATE_QUIZ_AI','{\"topic\":\"số pi\",\"limit\":8}','Thành công: Đã tạo Quiz ID 22 với 8 câu hỏi thật.','2026-03-23 04:13:52');
/*!40000 ALTER TABLE `api_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_name` (`permission_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quiz_id` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `options` json NOT NULL,
  `correct_answer` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (1,1,'Câu hỏi mẫu về Lập trình Node.js cơ bản 1','[\"A\", \"B\", \"C\", \"D\"]','A'),(2,1,'Câu hỏi mẫu về Lập trình Node.js cơ bản 2','[\"E\", \"F\", \"G\", \"H\"]','F'),(3,2,'Câu hỏi mẫu về Lập trình Node.js cơ bản 1','[\"A\", \"B\", \"C\", \"D\"]','A'),(4,2,'Câu hỏi mẫu về Lập trình Node.js cơ bản 2','[\"E\", \"F\", \"G\", \"H\"]','F'),(5,3,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (API đang bận)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(6,4,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (API đang bận)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(7,5,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (API đang bận)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(8,6,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (API đang bận)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(9,7,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (API đang bận)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(10,8,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Hệ thống AI đang bảo trì)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(11,9,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Hệ thống AI đang bảo trì)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(12,10,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Hệ thống AI đang phản hồi chậm)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(13,11,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Đang cập nhật Model 2.0)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(14,12,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Đang cập nhật Model 2.0)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(15,13,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Đang cập nhật Model 2.0)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(16,14,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Đang cập nhật Model 2.0)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(17,15,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Đang cập nhật Model 2.0)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(18,16,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Đang cập nhật Model 2.0)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(19,17,'Câu hỏi dự phòng về Lập trình Node.js cơ bản (Đang cập nhật Model 2.0)','[\"Đáp án 1\", \"Đáp án 2\", \"Đáp án 3\", \"Đáp án 4\"]','Đáp án 1'),(20,22,'Số pi (π) được định nghĩa là tỉ số giữa đại lượng nào của một đường tròn?','[\"A. Bán kính và đường kính\", \"B. Chu vi và bán kính\", \"C. Chu vi và đường kính\", \"D. Diện tích và bán kính\"]','C. Chu vi và đường kính'),(21,22,'Giá trị xấp xỉ phổ biến nhất của số pi thường được sử dụng trong các phép tính cơ bản là bao nhiêu?','[\"A. 2.71\", \"B. 3.00\", \"C. 3.14\", \"D. 3.16\"]','C. 3.14'),(22,22,'Trong toán học, số pi (π) được phân loại là loại số nào?','[\"A. Số nguyên\", \"B. Số hữu tỉ\", \"C. Số vô tỉ\", \"D. Số phức\"]','C. Số vô tỉ'),(23,22,'Số pi (π) là một số siêu việt (transcendental). Điều này có nghĩa là gì?','[\"A. Nó là nghiệm của một phương trình đa thức với hệ số nguyên.\", \"B. Nó có thể được biểu diễn dưới dạng phân số a/b.\", \"C. Nó không phải là nghiệm của bất kỳ phương trình đa thức nào với hệ số hữu tỉ (khác 0).\", \"D. Nó là một số phức.\"]','C. Nó không phải là nghiệm của bất kỳ phương trình đa thức nào với hệ số hữu tỉ (khác 0).'),(24,22,'Nhà toán học cổ đại nào nổi tiếng với việc tính toán giá trị của số pi bằng phương pháp hình học (phương pháp vét cạn) thông qua việc sử dụng các đa giác nội tiếp và ngoại tiếp đường tròn?','[\"A. Euclid\", \"B. Pythagoras\", \"C. Archimedes\", \"D. Thales\"]','C. Archimedes'),(25,22,'Ký hiệu \'π\' cho số pi được phổ biến rộng rãi bởi nhà toán học nào vào thế kỷ 18?','[\"A. Isaac Newton\", \"B. Gottfried Leibniz\", \"C. Leonhard Euler\", \"D. Carl Friedrich Gauss\"]','C. Leonhard Euler'),(26,22,'Công thức tính diện tích hình tròn là A = πr². Trong công thức này, \'r\' đại diện cho yếu tố nào của đường tròn?','[\"A. Chu vi\", \"B. Đường kính\", \"C. Bán kính\", \"D. Dây cung\"]','C. Bán kính'),(27,22,'Do tính chất là số vô tỉ, điều gì đúng về các chữ số thập phân của số pi?','[\"A. Chúng lặp lại theo một chu kỳ nhất định.\", \"B. Chúng kết thúc sau một số hữu hạn chữ số.\", \"C. Chúng kéo dài vô hạn và không lặp lại theo một chu kỳ nhất định.\", \"D. Chúng chỉ bao gồm các số chẵn.\"]','C. Chúng kéo dài vô hạn và không lặp lại theo một chu kỳ nhất định.');
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES (1,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-18 02:49:59'),(2,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-18 02:54:22'),(3,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 02:36:07'),(4,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 02:39:50'),(5,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 02:40:15'),(6,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 02:42:33'),(7,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 02:44:49'),(8,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 02:48:41'),(9,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 02:51:03'),(10,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 02:52:39'),(11,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 03:00:03'),(12,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 03:18:28'),(13,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 03:27:39'),(14,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 03:31:10'),(15,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 03:32:21'),(16,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 03:33:52'),(17,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 03:35:22'),(18,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 03:41:51'),(19,'Quiz về Lập trình Node.js cơ bản',NULL,3,'2026-03-23 03:42:21'),(20,'Quiz về số pi',NULL,3,'2026-03-23 03:43:47'),(21,'Quiz về số pi',NULL,3,'2026-03-23 03:44:49'),(22,'Quiz về số pi',NULL,3,'2026-03-23 04:13:52');
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `results`
--

DROP TABLE IF EXISTS `results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `quiz_id` int DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `results_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `results`
--

LOCK TABLES `results` WRITE;
/*!40000 ALTER TABLE `results` DISABLE KEYS */;
/*!40000 ALTER TABLE `results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Student','Người học tham gia giải đố'),(2,'Teacher','Người tạo đề và quản lý lớp học'),(3,'Admin','Quản trị viên hệ thống');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'Nguyễn Văn Làm','hoanthanh@gmail.com','$2b$10$6jxTwIoF0ukmkmjkxJczpeKtyjg6WGeyAvqr2fNK.flRtZaim9bZ2',1,'2026-03-17 10:25:40');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-23 14:55:39
