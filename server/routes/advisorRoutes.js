import express from "express";
import { analyzeUser } from "../controllers/advisorController.js";
import { getMarketData, getStockHistory } from "../controllers/marketController.js";
import { getRecommendations, chatWithAI } from "../controllers/aiController.js";

const router = express.Router();

// API endpoint
router.post("/analyze-user", analyzeUser);

// Route for global market data
router.get("/market", getMarketData);

// Route for individual stock history
router.get("/market/history/:symbol", getStockHistory);

// AI Routes
router.get("/ai/recommend", getRecommendations);
router.post("/ai/chat", chatWithAI);

export default router;
