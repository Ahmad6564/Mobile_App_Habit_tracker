import { Link } from "react-router-dom";

function NutritionUploadPage() {
  return (
    <section className="stack">
      <h3>Upload Meal Image</h3>
      <article className="card form-card">
        <label>
          Meal Type
          <select>
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
            <option>Snack</option>
          </select>
        </label>
        <label>
          Upload photo
          <input type="file" accept="image/*" />
        </label>
        <div className="row-end">
          <Link className="primary-btn" to="/nutrition/result/mock-1">
            Analyze with AI
          </Link>
        </div>
      </article>
    </section>
  );
}

export default NutritionUploadPage;
