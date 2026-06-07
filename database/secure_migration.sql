-- Schema Migration: Security Enhancements for Smart Investment Advisor
USE smartinvestmentadvisor;

-- Add password_hash column
ALTER TABLE USER ADD COLUMN password_hash VARCHAR(255) NULL;

-- Add role column
ALTER TABLE USER ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';

-- Create AUDIT_LOGS table to record all critical actions
CREATE TABLE IF NOT EXISTS AUDIT_LOGS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE SET NULL
);
