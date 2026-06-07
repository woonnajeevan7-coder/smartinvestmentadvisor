import db from "../config/db.js";
import { logAuditAction } from "../utils/auditLogger.js";

// Helper to validate positive integers
const isPositiveInteger = (val) => {
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
};

// Helper to validate positive float numbers
const isPositiveNumber = (val) => {
  const num = Number(val);
  return !isNaN(num) && num > 0;
};

/**
 * @api {get} /api/holdings Fetch authenticated user's portfolio holdings
 * @apiGroup Transactions
 * @apiHeader {String} Authorization Bearer <token>
 */
export const getHoldings = async (req, res, next) => {
  const userId = req.user.id; // Resolving directly from the verified JWT token

  try {
    const [rows] = await db.promise().query(
      "SELECT id, user_id, symbol, name, quantity, avg_price AS avgPrice, last_updated FROM HOLDINGS WHERE user_id = ?", 
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/**
 * @api {post} /api/trade/buy Purchase shares of an asset
 * @apiGroup Transactions
 * @apiHeader {String} Authorization Bearer <token>
 * @apiBody {String} symbol Ticker symbol of asset (e.g. 'AAPL')
 * @apiBody {String} name Full name of asset
 * @apiBody {Number} quantity Positive integer quantity to purchase
 * @apiBody {Number} price Current purchase price per share
 */
export const buyAsset = async (req, res, next) => {
  const { symbol, name, quantity, price } = req.body;
  const userId = req.user.id; // Resolving directly from the verified JWT token

  // Input validations (Express-validator runs before, fallback here)
  if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0 || symbol.length > 20) {
    return res.status(400).json({ error: "A valid ticker symbol (max 20 chars) is required" });
  }
  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 255) {
    return res.status(400).json({ error: "A valid asset name (max 255 chars) is required" });
  }
  if (!quantity || !isPositiveInteger(quantity)) {
    return res.status(400).json({ error: "Quantity must be a positive integer greater than 0" });
  }
  if (!price || !isPositiveNumber(price)) {
    return res.status(400).json({ error: "Price must be a positive number greater than 0" });
  }

  const cleanedSymbol = symbol.trim().toUpperCase();
  const cleanedName = name.trim();
  const parsedQty = parseInt(quantity, 10);
  const parsedPrice = parseFloat(price);
  const totalCost = Number((parsedQty * parsedPrice).toFixed(2));

  let connection = null;

  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // 1. Check User exists and retrieve Balance
    const [userRows] = await connection.query("SELECT balance FROM USER WHERE id = ? FOR UPDATE", [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found" });
    }

    const currentBalance = parseFloat(userRows[0].balance) || 0;
    if (currentBalance < totalCost) {
      await connection.rollback();
      return res.status(400).json({ 
        error: `Insufficient balance. Required: $${totalCost.toFixed(2)}, Available: $${currentBalance.toFixed(2)}` 
      });
    }

    // 2. Deduct Balance
    await connection.query("UPDATE USER SET balance = balance - ? WHERE id = ?", [totalCost, userId]);

    // 3. Update or Insert Holdings
    await connection.query(`
      INSERT INTO HOLDINGS (user_id, symbol, name, quantity, avg_price)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        avg_price = (avg_price * quantity + ?) / (quantity + ?),
        quantity = quantity + ?
    `, [userId, cleanedSymbol, cleanedName, parsedQty, parsedPrice, totalCost, parsedQty, parsedQty]);

    // 4. Record Transaction
    await connection.query(`
      INSERT INTO TRANSACTIONS (user_id, type, symbol, name, amount, quantity, price)
      VALUES (?, 'BUY', ?, ?, ?, ?, ?)
    `, [userId, cleanedSymbol, cleanedName, totalCost, parsedQty, parsedPrice]);

    await connection.commit();

    // Record audit event after transaction commits successfully
    await logAuditAction(userId, "BUY", { symbol: cleanedSymbol, quantity: parsedQty, price: parsedPrice, totalCost }, req);

    res.json({ success: true, message: "Purchase completed successfully" });

  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * @api {post} /api/trade/sell Sell shares of owned asset
 * @apiGroup Transactions
 * @apiHeader {String} Authorization Bearer <token>
 * @apiBody {String} symbol Ticker symbol of asset
 * @apiBody {Number} quantity Positive integer quantity to sell
 * @apiBody {Number} price Current sale price per share
 */
export const sellAsset = async (req, res, next) => {
  const { symbol, quantity, price } = req.body;
  const userId = req.user.id; // Resolving directly from the verified JWT token

  // Input validations (Express-validator runs before, fallback here)
  if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0 || symbol.length > 20) {
    return res.status(400).json({ error: "A valid ticker symbol is required" });
  }
  if (!quantity || !isPositiveInteger(quantity)) {
    return res.status(400).json({ error: "Quantity must be a positive integer greater than 0" });
  }
  if (!price || !isPositiveNumber(price)) {
    return res.status(400).json({ error: "Price must be a positive number greater than 0" });
  }

  const cleanedSymbol = symbol.trim().toUpperCase();
  const parsedQty = parseInt(quantity, 10);
  const parsedPrice = parseFloat(price);
  const totalGain = Number((parsedQty * parsedPrice).toFixed(2));

  let connection = null;

  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // 1. Fetch User details to verify user existence
    const [userRows] = await connection.query("SELECT id FROM USER WHERE id = ? FOR UPDATE", [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Check existing holding
    const [holdingRows] = await connection.query(
      "SELECT id, quantity, name FROM HOLDINGS WHERE user_id = ? AND symbol = ? FOR UPDATE", 
      [userId, cleanedSymbol]
    );

    if (holdingRows.length === 0 || holdingRows[0].quantity < parsedQty) {
      await connection.rollback();
      return res.status(400).json({ error: "Insufficient shares owned for this asset transaction" });
    }

    const currentQty = holdingRows[0].quantity;
    const assetName = holdingRows[0].name;

    // 3. Add to user balance
    await connection.query("UPDATE USER SET balance = balance + ? WHERE id = ?", [totalGain, userId]);

    // 4. Update or Delete holdings
    if (currentQty === parsedQty) {
      await connection.query("DELETE FROM HOLDINGS WHERE id = ?", [holdingRows[0].id]);
    } else {
      await connection.query("UPDATE HOLDINGS SET quantity = quantity - ? WHERE id = ?", [parsedQty, holdingRows[0].id]);
    }

    // 5. Record Transaction
    await connection.query(`
      INSERT INTO TRANSACTIONS (user_id, type, symbol, name, amount, quantity, price)
      VALUES (?, 'SELL', ?, ?, ?, ?, ?)
    `, [userId, cleanedSymbol, assetName, totalGain, parsedQty, parsedPrice]);

    await connection.commit();

    // Record audit event after transaction commits successfully
    await logAuditAction(userId, "SELL", { symbol: cleanedSymbol, quantity: parsedQty, price: parsedPrice, totalGain }, req);

    res.json({ success: true, message: "Sale completed successfully" });

  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * @api {post} /api/wallet/update Update wallet balance (Deposit or Withdraw)
 * @apiGroup Transactions
 * @apiHeader {String} Authorization Bearer <token>
 * @apiBody {String} type Transaction type ('Deposit' or 'Withdraw')
 * @apiBody {Number} amount Positive monetary amount (>0)
 * @apiBody {String} method Payment/payout method description (e.g. 'Bank Transfer')
 */
export const updateWallet = async (req, res, next) => {
  const { type, amount, method } = req.body;
  const userId = req.user.id; // Resolving directly from the verified JWT token

  // Input validations (Express-validator runs before, fallback here)
  if (type !== "Deposit" && type !== "Withdraw") {
    return res.status(400).json({ error: "Transaction type must be either 'Deposit' or 'Withdraw'" });
  }
  if (!amount || !isPositiveNumber(amount)) {
    return res.status(400).json({ error: "Amount must be a positive number greater than 0" });
  }
  if (!method || typeof method !== "string" || method.trim().length === 0 || method.length > 50) {
    return res.status(400).json({ error: "A valid payment/withdrawal method (max 50 chars) is required" });
  }

  const parsedAmount = parseFloat(amount);
  const cleanedMethod = method.trim();

  let connection = null;

  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // 1. Verify User and check current balance
    const [userRows] = await connection.query("SELECT balance FROM USER WHERE id = ? FOR UPDATE", [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found" });
    }

    const currentBalance = parseFloat(userRows[0].balance) || 0;

    if (type === "Deposit") {
      // 2. Perform Deposit
      await connection.query(
        "UPDATE USER SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?", 
        [parsedAmount, parsedAmount, userId]
      );
    } else {
      // 3. Perform Withdrawal
      if (currentBalance < parsedAmount) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `Insufficient balance for withdrawal. Available: $${currentBalance.toFixed(2)}, Requested: $${parsedAmount.toFixed(2)}` 
        });
      }
      await connection.query(
        "UPDATE USER SET balance = balance - ?, total_withdrawn = total_withdrawn + ? WHERE id = ?", 
        [parsedAmount, parsedAmount, userId]
      );
    }

    // 4. Record Transaction
    await connection.query(`
      INSERT INTO TRANSACTIONS (user_id, type, amount, method, status)
      VALUES (?, ?, ?, ?, 'Completed')
    `, [userId, type, parsedAmount, cleanedMethod]);

    await connection.commit();

    // Record audit event after transaction commits successfully
    await logAuditAction(userId, type.toUpperCase(), { amount: parsedAmount, method: cleanedMethod }, req);

    res.json({ success: true, message: `${type} completed successfully` });

  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * @api {get} /api/history Fetch transaction history logs
 * @apiGroup Transactions
 * @apiHeader {String} Authorization Bearer <token>
 */
export const getHistory = async (req, res, next) => {
  const userId = req.user.id; // Resolving directly from the verified JWT token

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM TRANSACTIONS WHERE user_id = ? ORDER BY date DESC", 
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
