-- MySQL dump 10.13  Distrib 9.6.0, for macos14.8 (x86_64)
--
-- Host: 127.0.0.1    Database: shan_database
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `city` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `credit_limit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `outstanding_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_code` (`customer_code`),
  UNIQUE KEY `idx_customers_code` (`customer_code`),
  UNIQUE KEY `customer_code_2` (`customer_code`),
  UNIQUE KEY `customer_code_3` (`customer_code`),
  UNIQUE KEY `customer_code_4` (`customer_code`),
  UNIQUE KEY `customer_code_5` (`customer_code`),
  UNIQUE KEY `customer_code_6` (`customer_code`),
  UNIQUE KEY `customer_code_7` (`customer_code`),
  UNIQUE KEY `customer_code_8` (`customer_code`),
  UNIQUE KEY `customer_code_9` (`customer_code`),
  UNIQUE KEY `customer_code_10` (`customer_code`),
  KEY `idx_customers_name` (`name`),
  KEY `idx_customers_city` (`city`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'CUST-851798','nduwne','2323','323',0.00,0.00,'2026-04-24 18:54:11','2026-05-15 19:06:12'),(2,'CUST-050498','Imran','03003040330',NULL,0.00,4407.26,'2026-05-01 05:40:50','2026-05-16 17:29:14');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_orders`
--

DROP TABLE IF EXISTS `delivery_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_no` varchar(60) COLLATE utf8mb4_general_ci NOT NULL,
  `invoice_no` varchar(60) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `gray_lot_id` bigint unsigned NOT NULL,
  `order_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `total_amount` decimal(12,2) NOT NULL,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_gray_gazana` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_ready_gazana` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rate` decimal(12,2) DEFAULT NULL,
  `rate_unit` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `grid_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  UNIQUE KEY `idx_delivery_order_no` (`order_no`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `gray_lot_id` (`gray_lot_id`),
  KEY `idx_delivery_customer_date` (`customer_id`,`order_date`),
  KEY `idx_delivery_status_date` (`status`,`order_date`),
  KEY `idx_delivery_due_date` (`due_date`),
  CONSTRAINT `delivery_orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `delivery_orders_ibfk_2` FOREIGN KEY (`gray_lot_id`) REFERENCES `gray_lots` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `delivery_orders_chk_1` CHECK (json_valid(`grid_data`))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_orders`
--

LOCK TABLES `delivery_orders` WRITE;
/*!40000 ALTER TABLE `delivery_orders` DISABLE KEYS */;
INSERT INTO `delivery_orders` VALUES (12,'DO-0001','INV-0001',2,5,'2026-05-16',NULL,'billed',54407.26,50000.00,1000.00,995.00,50.00,'yard','{\"rows\":[{\"id\":\"1778951950809-0-0.6283271644318749\",\"rowNumber\":0,\"values\":{\"1\":{\"gray\":200,\"ready\":199}}},{\"id\":\"1778951950809-1-0.9872562126712279\",\"rowNumber\":1,\"values\":{\"1\":{\"gray\":200,\"ready\":199}}},{\"id\":\"1778951950809-2-0.8593867423009358\",\"rowNumber\":2,\"values\":{\"1\":{\"gray\":200,\"ready\":199}}},{\"id\":\"1778951950809-3-0.4239549991695475\",\"rowNumber\":3,\"values\":{\"1\":{\"gray\":200,\"ready\":199}}},{\"id\":\"1778951950809-4-0.6223156674984238\",\"rowNumber\":4,\"values\":{\"1\":{\"gray\":200,\"ready\":199}}}],\"colors\":[{\"id\":\"1\",\"name\":\"White\"}]}','2026-05-16 17:19:58','2026-05-16 17:29:14');
/*!40000 ALTER TABLE `delivery_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gray_lots`
--

DROP TABLE IF EXISTS `gray_lots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gray_lots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entry_date` date NOT NULL,
  `party_name` varchar(160) COLLATE utf8mb4_general_ci NOT NULL,
  `process_type` varchar(40) COLLATE utf8mb4_general_ci NOT NULL,
  `bill_no` varchar(60) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `lot_no` varchar(60) COLLATE utf8mb4_general_ci NOT NULL,
  `quality` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `measurement` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `than` int unsigned NOT NULL DEFAULT '0',
  `gazana` decimal(12,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lot_no` (`lot_no`),
  UNIQUE KEY `idx_gray_lot_no` (`lot_no`),
  UNIQUE KEY `lot_no_2` (`lot_no`),
  UNIQUE KEY `lot_no_3` (`lot_no`),
  UNIQUE KEY `lot_no_4` (`lot_no`),
  UNIQUE KEY `lot_no_5` (`lot_no`),
  UNIQUE KEY `lot_no_6` (`lot_no`),
  KEY `idx_gray_party_date` (`party_name`,`entry_date`),
  KEY `idx_gray_process_date` (`process_type`,`entry_date`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gray_lots`
--

LOCK TABLES `gray_lots` WRITE;
/*!40000 ALTER TABLE `gray_lots` DISABLE KEYS */;
INSERT INTO `gray_lots` VALUES (5,'2026-05-15','Imran','Dyeing','0909','GL-47378','Cotton','Meter',200,2000.00,NULL,'2026-05-15 19:09:28','2026-05-15 19:09:28'),(7,'2026-05-16','Imran','Dyeing','656','LOT-0001','Cotton','Yard',400,4000.00,NULL,'2026-05-16 17:43:41','2026-05-16 17:43:41');
/*!40000 ALTER TABLE `gray_lots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `phone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `currency` varchar(10) COLLATE utf8mb4_general_ci DEFAULT 'Rs',
  `terms` text COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations`
--

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES (1,'Shan Dyeing','Sheikhupura Road, Faisalabad','+92 300 1234567','info@shandyeing.com',NULL,'Rs',NULL,'2026-04-24 21:00:56','2026-04-24 21:00:56');
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `delivery_order_id` bigint unsigned NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `mode` varchar(30) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'cash',
  `reference_no` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `idx_payment_order_date` (`delivery_order_id`,`payment_date`),
  KEY `idx_payment_mode_date` (`mode`,`payment_date`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`delivery_order_id`) REFERENCES `delivery_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (4,12,'2026-05-16',50000.00,'cash','','2026-05-16 17:29:14','2026-05-16 17:29:14','');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qualities`
--

DROP TABLE IF EXISTS `qualities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qualities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qualities`
--

LOCK TABLES `qualities` WRITE;
/*!40000 ALTER TABLE `qualities` DISABLE KEYS */;
INSERT INTO `qualities` VALUES (1,'Cotton','2026-05-16 17:40:37','2026-05-16 17:40:37');
/*!40000 ALTER TABLE `qualities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(180) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` varchar(40) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'manager',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `idx_users_email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  KEY `idx_users_role_active` (`role`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@gmail.com','$2a$12$erLtfjGu.cxriP0eM1AjJeM4djjiOFF7fP5/xA4XlC7r6gXjT4UkK','admin',1,'2026-04-24 21:56:03','2026-04-24 21:56:03');
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

-- Dump completed on 2026-05-16 23:03:54
