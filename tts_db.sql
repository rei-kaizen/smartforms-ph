-- ============================================================================
-- MySQL version info
-- --------------------------------------------------------
-- Server version: 8.0.23
-- MySQL dump 10.13  Distrib 8.0.23, for macos11.0 (x86_64)
-- Host: localhost    
-- Database: tts_db
-- --------------------------------------------------------

-- Environment setup
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Character set configurations
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================================
-- Database Creation
-- ============================================================================
CREATE DATABASE IF NOT EXISTS `tts_db` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

USE `tts_db`;

-- ============================================================================
-- Table: user
-- Description: Stores user account and profile information
-- ============================================================================
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `preferred_user_id` varchar(50) NOT NULL COMMENT 'Username',
  `password_hash` varchar(255) NOT NULL COMMENT 'Hashed password',
  `last_name` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `phone` varchar(15) NOT NULL,
  `dob` date NOT NULL COMMENT 'Date of Birth',
  'region' varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `barangay` varchar(100) NOT NULL,
  `zip` varchar(10) NOT NULL,
  `account_status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`),
  UNIQUE KEY `username_unique` (`preferred_user_id`),
  KEY `name_index` (`last_name`,`first_name`),
  KEY `location_index` (`city`,`barangay`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- Table: user_sessions
-- Description: Stores active user session information
-- ============================================================================
DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL,
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token_unique` (`session_token`),
  KEY `user_session_index` (`user_id`),
  CONSTRAINT `fk_user_sessions_user_id` 
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- Table: password_reset_tokens
-- Description: Manages password reset requests
-- ============================================================================
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_unique` (`token`),
  KEY `reset_token_user_index` (`user_id`),
  CONSTRAINT `fk_reset_tokens_user_id` 
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- Stored Procedure: create_user
-- Description: Inserts a new user securely, with duplicate check handling
-- ============================================================================
DELIMITER $$
CREATE PROCEDURE `create_user`(
    IN p_email VARCHAR(255),
    IN p_preferred_user_id VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_last_name VARCHAR(100),
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_suffix VARCHAR(10),
    IN p_phone VARCHAR(15),
    IN p_dob DATE,
    IN p_mailing_philippines VARCHAR(50),
    IN p_province VARCHAR(100),
    IN p_city VARCHAR(100),
    IN p_barangay VARCHAR(100),
    IN p_postal VARCHAR(10),
    IN p_mailing_foreign VARCHAR(255)
)
BEGIN
    DECLARE duplicate_entry CONDITION FOR SQLSTATE '23000';
    DECLARE EXIT HANDLER FOR duplicate_entry
    BEGIN
        SELECT 'Duplicate entry found. User already exists.' AS error_message;
        ROLLBACK;
    END;

    START TRANSACTION;

    INSERT INTO user (
        email, preferred_user_id, password_hash, last_name, first_name, 
        middle_name, suffix, phone, dob, mailing_philippines, province, city, 
        barangay, postal, mailing_foreign
    ) VALUES (
        p_email, p_preferred_user_id, p_password_hash, p_last_name, p_first_name, 
        p_middle_name, p_suffix, p_phone, p_dob, p_mailing_philippines, p_province, p_city, 
        p_barangay, p_postal, p_mailing_foreign
    );

    COMMIT;

    SELECT LAST_INSERT_ID() AS user_id;
END$$
DELIMITER ;

-- ============================================================================
-- Trigger: before_user_update
-- Description: Automatically updates the `updated_at` timestamp on update
-- ============================================================================
DELIMITER $$
CREATE TRIGGER before_user_update 
BEFORE UPDATE ON user
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP();
END$$
DELIMITER ;

-- Finalize transaction and restore environment settings
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
