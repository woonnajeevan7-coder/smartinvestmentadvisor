-- Create database
CREATE DATABASE IF NOT EXISTS smartinvestmentadvisor;
USE smartinvestmentadvisor;

-- Table: USER
CREATE TABLE IF NOT EXISTS USER (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: USER_PROFILE
CREATE TABLE IF NOT EXISTS USER_PROFILE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    age INT NOT NULL,
    monthly_income DECIMAL(15,2) NOT NULL,
    savings DECIMAL(15,2) NOT NULL,
    investment_duration ENUM('Short', 'Mid', 'Long', 'Retirement') NOT NULL,
    risk_preference INT NOT NULL CHECK (risk_preference BETWEEN 1 AND 10),
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE
);

-- Table: RISK_CATEGORY
CREATE TABLE IF NOT EXISTS RISK_CATEGORY (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Table: USER_CATEGORY
CREATE TABLE IF NOT EXISTS USER_CATEGORY (
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES RISK_CATEGORY(id) ON DELETE CASCADE
);

-- Table: MARKET_SECTOR
CREATE TABLE IF NOT EXISTS MARKET_SECTOR (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Table: ASSET
CREATE TABLE IF NOT EXISTS ASSET (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'Stock', 'Bond', 'ETF', 'Crypto'
    sector_id INT NOT NULL,
    FOREIGN KEY (sector_id) REFERENCES MARKET_SECTOR(id) ON DELETE CASCADE
);

-- Table: ASSET_PERFORMANCE
CREATE TABLE IF NOT EXISTS ASSET_PERFORMANCE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    return_rate DECIMAL(5,2) NOT NULL, -- e.g., 8.5 for 8.5%
    risk_level VARCHAR(50), -- e.g., 'Low', 'Medium', 'High'
    FOREIGN KEY (asset_id) REFERENCES ASSET(id) ON DELETE CASCADE
);

-- Table: CATEGORY_SUGGESTION
CREATE TABLE IF NOT EXISTS CATEGORY_SUGGESTION (
    category_id INT NOT NULL,
    asset_id INT NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (category_id, asset_id),
    FOREIGN KEY (category_id) REFERENCES RISK_CATEGORY(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES ASSET(id) ON DELETE CASCADE
);

-- ==========================================
-- Insert Mock Data
-- ==========================================

-- Risk Categories
INSERT IGNORE INTO RISK_CATEGORY (name, description) VALUES
('Short Term', 'Focus on capital preservation and liquidity. Low risk.'),
('Mid Term', 'Balanced approach between growth and security. Moderate risk.'),
('Long Term', 'Focus on capital growth. Higher risk tolerance.'),
('Retirement', 'Aggressive growth early on, shifting to preservation later.');

-- Market Sectors
INSERT IGNORE INTO MARKET_SECTOR (name) VALUES
('Technology'), ('Finance'), ('Healthcare'), ('Government'), ('Crypto'), ('Broad Market');

-- Assets
INSERT IGNORE INTO ASSET (name, ticker, type, sector_id) VALUES
('Apple Inc.', 'AAPL', 'Stock', 1),
('Microsoft Corp.', 'MSFT', 'Stock', 1),
('JPMorgan Chase', 'JPM', 'Stock', 2),
('UnitedHealth Group', 'UNH', 'Stock', 3),
('US Treasury Bond 10Y', 'US10Y', 'Bond', 4),
('Vanguard 500 Index Fund', 'VOO', 'ETF', 6),
('Bitcoin', 'BTC', 'Crypto', 5),
('Ethereum', 'ETH', 'Crypto', 5);

-- Asset Performance
INSERT IGNORE INTO ASSET_PERFORMANCE (asset_id, return_rate, risk_level) VALUES
(1, 15.5, 'Medium'),
(2, 14.2, 'Medium'),
(3, 8.5, 'Medium'),
(4, 9.0, 'Medium'),
(5, 4.2, 'Low'),
(6, 10.0, 'Medium'),
(7, 45.0, 'High'),
(8, 50.0, 'High');

-- Category Suggestions (Allocations)
-- Assuming IDs: 
-- Categories: 1=Short Term, 2=Mid Term, 3=Long Term, 4=Retirement
-- Assets: 1=AAPL, 2=MSFT, 3=JPM, 4=UNH, 5=US10Y, 6=VOO, 7=BTC, 8=ETH

-- Short Term Allocation (mostly bonds, some broad market)
INSERT IGNORE INTO CATEGORY_SUGGESTION (category_id, asset_id, allocation_percentage) VALUES
(1, 5, 80.0), -- 80% Bonds
(1, 6, 20.0); -- 20% S&P 500

-- Mid Term Allocation
INSERT IGNORE INTO CATEGORY_SUGGESTION (category_id, asset_id, allocation_percentage) VALUES
(2, 5, 40.0), -- 40% Bonds
(2, 6, 40.0), -- 40% S&P 500
(2, 1, 10.0), -- 10% AAPL
(2, 2, 10.0); -- 10% MSFT

-- Long Term Allocation
INSERT IGNORE INTO CATEGORY_SUGGESTION (category_id, asset_id, allocation_percentage) VALUES
(3, 6, 50.0), -- 50% S&P 500
(3, 1, 15.0), -- 15% AAPL
(3, 2, 15.0), -- 15% MSFT
(3, 3, 10.0), -- 10% JPM
(3, 7, 10.0); -- 10% Crypto (BTC)

-- Retirement Allocation (very aggressive growth)
INSERT IGNORE INTO CATEGORY_SUGGESTION (category_id, asset_id, allocation_percentage) VALUES
(4, 6, 60.0), -- 60% S&P 500
(4, 1, 10.0), -- 10% AAPL
(4, 4, 10.0), -- 10% UNH
(4, 7, 10.0), -- 10% BTC
(4, 8, 10.0); -- 10% ETH
