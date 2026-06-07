import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { logAuditAction } from "../utils/auditLogger.js";

/**
 * Helper to check valid email string format.
 */
const isValidEmail = (email) => {
  return typeof email === "string" && email.includes("@") && email.length >= 3;
};

/**
 * @api {post} /api/register Register a new user
 * @apiGroup Auth
 * @apiBody {String} name User full name
 * @apiBody {String} email User email address
 * @apiBody {String} password Password (min 6 characters)
 */
export const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Validate request inputs (Express-validator runs before this, but checking as fallback)
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email address is required" });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  const userName = name && typeof name === "string" && name.trim() ? name.trim() : "Guest User";
  const userEmail = email.trim().toLowerCase();

  try {
    const promiseDb = db.promise();

    // Verify if user already exists
    const [existing] = await promiseDb.query("SELECT id FROM USER WHERE email = ?", [userEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "An account with this email address already exists" });
    }

    // Hash the password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into USER table with default 'user' role
    const [result] = await promiseDb.query(
      "INSERT INTO USER (name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
      [userName, userEmail, passwordHash]
    );

    const newUserId = result.insertId;

    // Log registration audit event
    await logAuditAction(newUserId, "REGISTER", `User registered with email: ${userEmail}`, req);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUserId,
        name: userName,
        email: userEmail,
        role: "user",
        balance: 0.00,
        totalDeposited: 0.00,
        totalWithdrawn: 0.00
      }
    });
  } catch (err) {
    next(err); // Centralized error handling
  }
};

/**
 * @api {post} /api/login Authenticate user and return JWT token
 * @apiGroup Auth
 * @apiBody {String} email User email address
 * @apiBody {String} password User password
 */
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required fields" });
  }

  const userEmail = email.trim().toLowerCase();

  try {
    const promiseDb = db.promise();

    // Query user including password hash and role
    const [rows] = await promiseDb.query("SELECT * FROM USER WHERE email = ?", [userEmail]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    // Check if user has a password hash (guest profiles might not have one)
    if (!user.password_hash) {
      return res.status(401).json({ error: "Password login not set for this account. Reset password or register." });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check for JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured in server environment");
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRY || "24h" }
    );

    // Save login audit event
    await logAuditAction(user.id, "LOGIN", "User logged in successfully", req);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: parseFloat(user.balance) || 0,
        totalDeposited: parseFloat(user.total_deposited) || 0,
        totalWithdrawn: parseFloat(user.total_withdrawn) || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @api {post} /api/logout End user session
 * @apiGroup Auth
 */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (userId) {
      await logAuditAction(userId, "LOGOUT", "User logged out", req);
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * @api {get} /api/me Retrieve authenticated user data and profile
 * @apiGroup Auth
 * @apiHeader {String} Authorization Bearer <token>
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const promiseDb = db.promise();

    // Query user details from DB
    const [users] = await promiseDb.query(
      "SELECT id, name, email, role, balance, total_deposited, total_withdrawn, created_at FROM USER WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Query onboarding survey details
    const [profiles] = await promiseDb.query(
      "SELECT age, monthly_income, savings, investment_duration, risk_preference FROM USER_PROFILE WHERE user_id = ?",
      [userId]
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: parseFloat(user.balance) || 0,
        totalDeposited: parseFloat(user.total_deposited) || 0,
        totalWithdrawn: parseFloat(user.total_withdrawn) || 0,
        created_at: user.created_at
      },
      profile: profiles.length > 0 ? profiles[0] : null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch current user profile and stats from database (JWT secured fallback)
 */
export const getProfile = async (req, res, next) => {
  // Map /profile calls directly to the authenticated user ID for security
  req.user = req.user || {};
  if (!req.user.id) {
    return res.status(401).json({ error: "Unauthorized access to profile" });
  }
  return getMe(req, res, next);
};
