const mealAnalysis = {
  meal: "Grilled chicken with rice and sauteed vegetables",
  calories: 640,
  protein: 42,
  carbs: 58,
  fat: 18,
  confidence: 0.87,
  suggestions: [
    "Great protein content for muscle recovery",
    "Consider adding a side salad for more fiber",
    "Stays within most daily calorie budgets",
  ],
};

function NutritionResultPage() {
  return (
    <section className="stack">
      <h3>AI Nutrition Result</h3>
      <article className="card nutrition-grid">
        <div>
          <p className="muted">Detected meal</p>
          <h4>{mealAnalysis.meal}</h4>
          <p className="muted">Confidence: {Math.round(mealAnalysis.confidence * 100)}%</p>
        </div>
        <div className="macro-cards">
          <div className="mini-card">
            <span>Calories</span>
            <strong>{mealAnalysis.calories}</strong>
          </div>
          <div className="mini-card">
            <span>Protein</span>
            <strong>{mealAnalysis.protein}g</strong>
          </div>
          <div className="mini-card">
            <span>Carbs</span>
            <strong>{mealAnalysis.carbs}g</strong>
          </div>
          <div className="mini-card">
            <span>Fat</span>
            <strong>{mealAnalysis.fat}g</strong>
          </div>
        </div>
        <ul className="suggestions">
          {mealAnalysis.suggestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export default NutritionResultPage;
