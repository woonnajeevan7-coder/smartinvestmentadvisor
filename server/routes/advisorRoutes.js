import express from "express";
import { 
  register, 
  login, 
  logout, 
  getMe, 
  getProfile 
} from "../controllers/authController.js";
import { analyzeUser } from "../controllers/advisorController.js";
import { getMarketData, getStockHistory } from "../controllers/marketController.js";
import { getRecommendations, chatWithAI } from "../controllers/aiController.js";
import { 
  getHoldings, 
  buyAsset, 
  sellAsset, 
  getHistory, 
  updateWallet 
} from "../controllers/transactionController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  registerValidationRules,
  loginValidationRules,
  analyzeUserValidationRules,
  buyAssetValidationRules,
  sellAssetValidationRules,
  walletUpdateValidationRules,
  validateRequest
} from "../middleware/validationMiddleware.js";

const router = express.Router();

/**
 * Public Authentication Routes
 */
router.post("/register", registerValidationRules, validateRequest, register);
router.post("/login", loginValidationRules, validateRequest, login);

/**
 * Protected Authentication Routes
 */
router.post("/logout", authenticateToken, logout);
router.get("/me", authenticateToken, getMe);
router.get("/profile", authenticateToken, getProfile);

/**
 * Protected Advisor & Onboarding Routes
 */
router.post("/analyze-user", authenticateToken, analyzeUserValidationRules, validateRequest, analyzeUser);

/**
 * Public Market & Data Feeds Routes
 */
router.get("/market", getMarketData);
router.get("/market/history/:symbol", getStockHistory);

/**
 * Protected Trading & Wallet Simulation Routes
 */
router.get("/holdings", authenticateToken, getHoldings);
router.post("/trade/buy", authenticateToken, buyAssetValidationRules, validateRequest, buyAsset);
router.post("/trade/sell", authenticateToken, sellAssetValidationRules, validateRequest, sellAsset);
router.get("/history", authenticateToken, getHistory);
router.post("/wallet/update", authenticateToken, walletUpdateValidationRules, validateRequest, updateWallet);

/**
 * Protected Strategic AI Guidance Routes
 */
router.get("/ai/recommend", authenticateToken, getRecommendations);
router.post("/ai/chat", authenticateToken, chatWithAI);

export default router;
