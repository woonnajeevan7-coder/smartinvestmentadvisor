import db from "../config/db.js";

/**
 * Utility to log audit events into the database.
 * @param {number|null} userId The ID of the user performing the action, or null if unauthenticated.
 * @param {string} action The category of the action (e.g. 'LOGIN', 'DEPOSIT', 'BUY').
 * @param {object|string} details Object or message detailing the parameters of the action.
 * @param {object|null} req Express request object to parse IP address.
 */
export const logAuditAction = async (userId, action, details, req = null) => {
  try {
    const ipAddress = req ? (req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress) : null;
    const detailsText = typeof details === "object" ? JSON.stringify(details) : details;

    const promiseDb = db.promise();
    await promiseDb.query(
      "INSERT INTO AUDIT_LOGS (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
      [userId, action, detailsText, ipAddress]
    );
    console.log(`📝 Audit Log Saved: ${action} for User ID ${userId || "Guest"}`);
  } catch (err) {
    console.error("❌ Audit Logging Failed:", err.message);
    // Non-blocking: Do not crash the application if audit log fails
  }
};
