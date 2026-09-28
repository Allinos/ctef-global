CREATE DATABASE IF NOT EXISTS ctef_global CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ctef_global;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('Workshop','Seminar','Conference') NOT NULL DEFAULT 'Workshop',
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  event_date DATE NOT NULL,
  event_time VARCHAR(100) NOT NULL DEFAULT '',
  place VARCHAR(255) NOT NULL DEFAULT '',
  image VARCHAR(255) DEFAULT NULL,
  seats INT NOT NULL DEFAULT 0,
  description TEXT,
  fee VARCHAR(255) DEFAULT '',
  outcome_note VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_date (event_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gallery_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image VARCHAR(255) NOT NULL,
  caption VARCHAR(255) NOT NULL DEFAULT '',
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gallery_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('Announcement','Circular','Award') NOT NULL DEFAULT 'Announcement',
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link VARCHAR(255) DEFAULT NULL,
  published_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_news_date (published_date),
  INDEX idx_news_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS journal_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  volume VARCHAR(50) NOT NULL,
  issue_no VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  theme VARCHAR(255) DEFAULT '',
  cover_image VARCHAR(255) DEFAULT NULL,
  issn VARCHAR(50) DEFAULT '',
  published_date DATE NOT NULL,
  language VARCHAR(100) DEFAULT 'English',
  pages VARCHAR(50) DEFAULT '',
  pdf_path VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_issues_date (published_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS journal_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  issue_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  authors VARCHAR(255) DEFAULT '',
  abstract TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (issue_id) REFERENCES journal_issues(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS newsletters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  published_date DATE NOT NULL,
  highlights TEXT,
  pdf_path VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_newsletters_date (published_date)
) ENGINE=InnoDB;
