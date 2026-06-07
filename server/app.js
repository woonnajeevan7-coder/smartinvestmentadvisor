import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
import advisorRoutes from "./routes/advisorRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

// 1. Mount Security Headers (Helmet)
app.use(helmet());

// 2. Configure Cross-Origin Resource Sharing (CORS) securely
const allowedOrigins = [
  "https://smartinvestmentadvisor.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// 3. Request Body Parser
app.use(express.json());

// 4. Rate Limiting Middlewares
// General Rate Limiter (200 requests / 15 mins)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests from this IP address, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(generalLimiter);

// Strict Authentication Limiter (10 register/login attempts / 1 min)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many login/registration attempts. Please wait 1 minute." },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/register", authLimiter);
app.use("/api/login", authLimiter);

// 5. Mount API Routes
app.use("/api", advisorRoutes);

// Root test route
app.get("/", (req, res) => {
  res.send("Smart Investment Advisor Secure API is running... 🚀");
});

// 6. Mount Centralized Error Middleware (Must be last in the stack)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running in production-mode on port ${PORT}`);
});
