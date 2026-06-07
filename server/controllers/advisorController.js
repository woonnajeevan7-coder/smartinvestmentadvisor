import db from "../config/db.js";

// Allowed values for investment duration
const ALLOWED_DURATIONS = ["Short Term", "Mid Term", "Long Term", "Retirement"];

/**
 * @api {post} /api/analyze-user Profile user investment parameters & return risk category
 * @apiGroup Advisor
 * @apiHeader {String} Authorization Bearer <token>
 * @apiBody {Number} age User age (18-120)
 * @apiBody {Number} income Monthly income (non-negative)
 * @apiBody {Number} savings Current savings (non-negative)
 * @apiBody {String} duration Investment duration ('Short Term', 'Mid Term', 'Long Term', 'Retirement')
 * @apiBody {Number} risk Risk preference score (1-10)
 */
export const analyzeUser = async (req, res, next) => {
  const { age, income, savings, duration, risk } = req.body;
  const userId = req.user.id; // Resolving directly from the verified JWT token

  // Parsing values
  const parsedAge = parseInt(age, 10);
  const parsedIncome = parseFloat(income);
  const parsedSavings = parseFloat(savings);
  const parsedRisk = parseInt(risk, 10);

  // Safety checks (Express-validator runs before this, this is a fallback)
  if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
    return res.status(400).json({ error: "Age must be an integer between 18 and 120" });
  }
  if (isNaN(parsedIncome) || parsedIncome < 0) {
    return res.status(400).json({ error: "Monthly income must be a non-negative number" });
  }
  if (isNaN(parsedSavings) || parsedSavings < 0) {
    return res.status(400).json({ error: "Current savings must be a non-negative number" });
  }
  if (isNaN(parsedRisk) || parsedRisk < 1 || parsedRisk > 10) {
    return res.status(400).json({ error: "Risk preference must be a valid integer between 1 and 10" });
  }
  if (!duration || !ALLOWED_DURATIONS.includes(duration)) {
    return res.status(400).json({ 
      error: `Investment duration must be one of: ${ALLOWED_DURATIONS.join(", ")}` 
    });
  }

  try {
    const promiseDb = db.promise();
    const formattedDuration = duration.split(" ")[0]; // Map e.g. "Long Term" -> "Long"

    // 1. Save/Update Profile for the authenticated user ID
    const [profiles] = await promiseDb.query("SELECT id FROM USER_PROFILE WHERE user_id = ?", [userId]);
    
    if (profiles.length > 0) {
      // Update existing profile
      await promiseDb.query(
        `UPDATE USER_PROFILE SET age = ?, monthly_income = ?, savings = ?, investment_duration = ?, risk_preference = ? 
         WHERE user_id = ?`,
        [parsedAge, parsedIncome, parsedSavings, formattedDuration, parsedRisk, userId]
      );
    } else {
      // Insert new profile
      await promiseDb.query(
        `INSERT INTO USER_PROFILE (user_id, age, monthly_income, savings, investment_duration, risk_preference) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, parsedAge, parsedIncome, parsedSavings, formattedDuration, parsedRisk]
      );
    }

    // --- Score Calculation Logic ---
    const ageFactor = parsedAge < 25 ? 3 : parsedAge <= 40 ? 2 : parsedAge <= 60 ? 1 : 0;
    const incomeFactor = parsedIncome > 100000 ? 3 : parsedIncome >= 50000 ? 2 : 1;
    
    const savingsRatio = parsedIncome > 0 ? parsedSavings / parsedIncome : 0;
    const savingsFactor = savingsRatio > 0.5 ? 3 : savingsRatio >= 0.2 ? 2 : 1;
    
    const durationFactor = duration === "Short Term" ? 1 : duration === "Mid Term" ? 2 : duration === "Long Term" ? 3 : 4;
    
    const totalScore = (ageFactor * 2) + (incomeFactor * 2) + (savingsFactor * 2) + (durationFactor * 3) + parsedRisk;

    let category = "Short Term";
    if (totalScore <= 15) category = "Short Term";
    else if (totalScore <= 25) category = "Mid Term";
    else if (totalScore <= 35) category = "Long Term";
    else category = "Retirement";

    // 2. Fetch Suggestions from the static categories Suggestion tables
    const query = `
      SELECT a.name as asset_name, a.type as asset_type
      FROM ASSET a
      JOIN CATEGORY_SUGGESTION cs ON a.id = cs.asset_id
      JOIN RISK_CATEGORY rc ON cs.category_id = rc.id
      WHERE rc.name = ?
    `;

    const [recommendations] = await promiseDb.query(query, [category]);

    res.json({
      category,
      score: totalScore,
      recommendations: recommendations.length > 0 ? recommendations : [
        { asset_name: "S&P 500 Index Fund", asset_type: "ETF" },
        { asset_name: "US Treasury Bonds", asset_type: "Bond" }
      ]
    });

  } catch (err) {
    next(err);
  }
};
