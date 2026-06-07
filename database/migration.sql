-- Production Migration and Setup Script for Smart Investment Advisor
-- Combines core schemas, extensions, and mock data definitions cleanly.

USE smartinvestmentadvisor;

-- Temporarily disable foreign key checks to avoid deletion and creation order issues
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all possible conflicting tables in the database
DROP TABLE IF EXISTS CATEGORY_SUGGESTION;
DROP TABLE IF EXISTS ASSET_PERFORMANCE;
DROP TABLE IF EXISTS ASSET;
DROP TABLE IF EXISTS MARKET_SECTOR;
DROP TABLE IF EXISTS USER_CATEGORY;
DROP TABLE IF EXISTS USER_PROFILE;
DROP TABLE IF EXISTS RISK_CATEGORY;
DROP TABLE IF EXISTS TRANSACTIONS;
DROP TABLE IF EXISTS HOLDINGS;
DROP TABLE IF EXISTS USER;

-- Drop assignment-related tables that may contain conflicting constraints on USER/investment tables
DROP TABLE IF EXISTS advisor_view;
DROP TABLE IF EXISTS userview;
DROP TABLE IF EXISTS advisor_3nf;
DROP TABLE IF EXISTS user_advisor_3nf;
DROP TABLE IF EXISTS user_investment_2nf;
DROP TABLE IF EXISTS investment_2nf;
DROP TABLE IF EXISTS investment_1nf;
DROP TABLE IF EXISTS user_1nf;
DROP TABLE IF EXISTS advisor;
DROP TABLE IF EXISTS investment;
DROP TABLE IF EXISTS recommendation;
DROP TABLE IF EXISTS portfolio;
DROP TABLE IF EXISTS transaction_table;
DROP TABLE IF EXISTS unf_table;

-- Table: USER (Main Account Data)
CREATE TABLE USER (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    total_deposited DECIMAL(15,2) DEFAULT 0.00,
    total_withdrawn DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: USER_PROFILE (Onboarding Survey Details)
CREATE TABLE USER_PROFILE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    age INT NOT NULL,
    monthly_income DECIMAL(15,2) NOT NULL,
    savings DECIMAL(15,2) NOT NULL,
    investment_duration ENUM('Short', 'Mid', 'Long', 'Retirement') NOT NULL,
    risk_preference INT NOT NULL CHECK (risk_preference BETWEEN 1 AND 10),
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE
);

-- Table: RISK_CATEGORY (Onboarding Output Classifications)
CREATE TABLE RISK_CATEGORY (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Table: USER_CATEGORY (User-to-Risk classification links)
CREATE TABLE USER_CATEGORY (
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES RISK_CATEGORY(id) ON DELETE CASCADE
);

-- Table: MARKET_SECTOR (Industries)
CREATE TABLE MARKET_SECTOR (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Table: ASSET (Financial Instruments)
CREATE TABLE ASSET (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Stock', 'Bond', 'ETF', 'Crypto'
    sector_id INT NOT NULL,
    FOREIGN KEY (sector_id) REFERENCES MARKET_SECTOR(id) ON DELETE CASCADE
);

-- Table: ASSET_PERFORMANCE (Metrics)
CREATE TABLE ASSET_PERFORMANCE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    return_rate DECIMAL(5,2) NOT NULL, -- e.g. 15.5 for 15.5%
    risk_level VARCHAR(50), -- 'Low', 'Medium', 'High'
    FOREIGN KEY (asset_id) REFERENCES ASSET(id) ON DELETE CASCADE
);

-- Table: CATEGORY_SUGGESTION (Portfolio asset allocations)
CREATE TABLE CATEGORY_SUGGESTION (
    category_id INT NOT NULL,
    asset_id INT NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (category_id, asset_id),
    FOREIGN KEY (category_id) REFERENCES RISK_CATEGORY(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES ASSET(id) ON DELETE CASCADE
);

-- Table: TRANSACTIONS (Simulator activity log)
CREATE TABLE TRANSACTIONS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('BUY', 'SELL', 'Deposit', 'Withdraw') NOT NULL,
    symbol VARCHAR(20),
    name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    quantity INT DEFAULT 0,
    price DECIMAL(15,2) DEFAULT 0.00,
    method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Completed',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE
);

-- Table: HOLDINGS (Simulator active inventory)
CREATE TABLE HOLDINGS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    avg_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (user_id, symbol),
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE
);

-- ==========================================
-- Insert Mock Data
-- ==========================================

-- Risk Categories
INSERT INTO RISK_CATEGORY (name, description) VALUES
('Short Term', 'Focus on capital preservation and liquidity. Low risk.'),
('Mid Term', 'Balanced approach between growth and security. Moderate risk.'),
('Long Term', 'Focus on capital growth. Higher risk tolerance.'),
('Retirement', 'Aggressive growth early on, shifting to preservation later.');

-- Market Sectors
INSERT INTO MARKET_SECTOR (name) VALUES
('Technology'), ('Finance'), ('Healthcare'), ('Government'), ('Crypto'), ('Broad Market');

-- Assets
INSERT INTO ASSET (name, ticker, type, sector_id) VALUES
('Apple Inc.', 'AAPL', 'Stock', 1),
('Microsoft Corp.', 'MSFT', 'Stock', 1),
('JPMorgan Chase', 'JPM', 'Stock', 2),
('UnitedHealth Group', 'UNH', 'Stock', 3),
('US Treasury Bond 10Y', 'US10Y', 'Bond', 4),
('Vanguard 500 Index Fund', 'VOO', 'ETF', 6),
('Bitcoin', 'BTC', 'Crypto', 5),
('Ethereum', 'ETH', 'Crypto', 5);

-- Asset Performance
INSERT INTO ASSET_PERFORMANCE (asset_id, return_rate, risk_level) VALUES
(1, 15.50, 'Medium'),
(2, 14.20, 'Medium'),
(3, 8.50, 'Medium'),
(4, 9.00, 'Medium'),
(5, 4.20, 'Low'),
(6, 10.00, 'Medium'),
(7, 45.00, 'High'),
(8, 50.00, 'High');

-- Suggestions Allocations
INSERT INTO CATEGORY_SUGGESTION (category_id, asset_id, allocation_percentage) VALUES
-- Short Term (1)
(1, 5, 80.00), -- 80% Bonds
(1, 6, 20.00), -- 20% ETF
-- Mid Term (2)
(2, 5, 40.00),
(2, 6, 40.00),
(2, 1, 10.00),
(2, 2, 10.00),
-- Long Term (3)
(3, 6, 50.00),
(3, 1, 15.00),
(3, 2, 15.00),
(3, 3, 10.00),
(3, 7, 10.00),
-- Retirement (4)
(4, 6, 60.00),
(4, 1, 10.00),
(4, 4, 10.00),
(4, 7, 10.00),
(4, 8, 10.00);

-- Re-enable foreign key checks at the end
SET FOREIGN_KEY_CHECKS = 1;
