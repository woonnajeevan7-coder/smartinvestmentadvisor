import db from "../config/db.js";

export const analyzeUser = (req, res) => {
  const { age, income, savings, duration, risk } = req.body;

  const a = parseInt(age) || 0;
  const inc = parseInt(income) || 0;
  const sav = parseInt(savings) || 0;
  const r = parseInt(risk) || 5;

  // 1. Age Factor
  let ageFactor = 0;
  if (a > 0 && a < 25) ageFactor = 3;
  else if (a >= 25 && a <= 40) ageFactor = 2;
  else if (a > 40 && a <= 60) ageFactor = 1;
  else ageFactor = 0;

  // 2. Income Factor
  let incomeFactor = 0;
  if (inc > 100000) incomeFactor = 3;
  else if (inc >= 50000 && inc <= 100000) incomeFactor = 2;
  else incomeFactor = 1;

  // 3. Savings Ratio
  let savingsFactor = 0;
  const ratio = inc > 0 ? sav / inc : 0;
  if (ratio > 0.5) savingsFactor = 3;
  else if (ratio >= 0.2 && ratio <= 0.5) savingsFactor = 2;
  else savingsFactor = 1;

  // 4. Duration Factor
  let durationFactor = 0;
  if (duration === "Short Term") durationFactor = 1;
  else if (duration === "Mid Term") durationFactor = 2;
  else if (duration === "Long Term") durationFactor = 3;
  else if (duration === "Retirement") durationFactor = 4;

  // 5. Total Score
  const totalScore = (ageFactor * 2) + (incomeFactor * 2) + (savingsFactor * 2) + (durationFactor * 3) + r;

  // 6. Category Decision
  let category = "Short Term";
  if (totalScore <= 15) category = "Short Term";
  else if (totalScore <= 25) category = "Mid Term";
  else if (totalScore <= 35) category = "Long Term";
  else category = "Retirement";

  // SQL query using your tables
  const query = `
    SELECT a.name as asset_name, a.type as asset_type
    FROM ASSET a
    JOIN CATEGORY_SUGGESTION cs ON a.id = cs.asset_id
    JOIN RISK_CATEGORY rc ON cs.category_id = rc.id
    WHERE rc.name = ?
  `;

  db.query(query, [category], (err, results) => {
    if (err) {
      console.error("❌ Query Error or DB not connected. Falling back to mock data:", err);
      return res.json({
        category,
        score: totalScore,
        recommendations: [
          { asset_name: "Mock Stock 1", asset_type: "Stock" },
          { asset_name: "Mock Bond 1", asset_type: "Bond" }
        ]
      });
    }

    res.json({
      category,
      score: totalScore,
      recommendations: results
    });
  });
};
