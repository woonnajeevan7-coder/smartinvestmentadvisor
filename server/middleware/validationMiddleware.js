import { body, validationResult } from "express-validator";

/**
 * Common formatter helper for validation results.
 * Halts processing and returns 400 bad request if validation failures exist.
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: "Validation error",
      details: errors.array().map(err => ({ field: err.path, message: err.msg })) 
    });
  }
  next();
};

export const registerValidationRules = [
  body("email")
    .trim()
    .isEmail().withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .isString().withMessage("Password must be a string")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("name")
    .optional()
    .trim()
    .isString().withMessage("Name must be a string")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters")
];

export const loginValidationRules = [
  body("email")
    .trim()
    .isEmail().withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .isString().withMessage("Password must be a string")
    .notEmpty().withMessage("Password cannot be empty")
];

export const analyzeUserValidationRules = [
  body("age")
    .isInt({ min: 18, max: 120 }).withMessage("Age must be an integer between 18 and 120"),
  body("income")
    .isFloat({ min: 0 }).withMessage("Income must be a non-negative number"),
  body("savings")
    .isFloat({ min: 0 }).withMessage("Savings must be a non-negative number"),
  body("duration")
    .isIn(["Short Term", "Mid Term", "Long Term", "Retirement"]).withMessage("Investment duration must be one of: 'Short Term', 'Mid Term', 'Long Term', 'Retirement'"),
  body("risk")
    .isInt({ min: 1, max: 10 }).withMessage("Risk preference score must be an integer between 1 and 10")
];

export const buyAssetValidationRules = [
  body("symbol")
    .trim()
    .isString().withMessage("Symbol must be a string")
    .isLength({ min: 1, max: 20 }).withMessage("Symbol must be between 1 and 20 characters")
    .toUpperCase(),
  body("name")
    .trim()
    .isString().withMessage("Asset name must be a string")
    .isLength({ min: 1, max: 255 }).withMessage("Asset name must be between 1 and 255 characters"),
  body("quantity")
    .isInt({ min: 1 }).withMessage("Quantity must be a positive integer greater than 0"),
  body("price")
    .isFloat({ min: 0.01 }).withMessage("Price must be a positive number greater than 0")
];

export const sellAssetValidationRules = [
  body("symbol")
    .trim()
    .isString().withMessage("Symbol must be a string")
    .isLength({ min: 1, max: 20 }).withMessage("Symbol must be between 1 and 20 characters")
    .toUpperCase(),
  body("quantity")
    .isInt({ min: 1 }).withMessage("Quantity must be a positive integer greater than 0"),
  body("price")
    .isFloat({ min: 0.01 }).withMessage("Price must be a positive number greater than 0")
];

export const walletUpdateValidationRules = [
  body("type")
    .isIn(["Deposit", "Withdraw"]).withMessage("Type must be either 'Deposit' or 'Withdraw'"),
  body("amount")
    .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number greater than 0"),
  body("method")
    .trim()
    .isString().withMessage("Payment method must be a string")
    .isLength({ min: 1, max: 50 }).withMessage("Method name must be between 1 and 50 characters")
];
