function JourneyNewPage() {
  return (
    <section className="stack">
      <h3>Write Journey Log</h3>
      <article className="card form-card">
        <label>
          What challenge did you face?
          <textarea placeholder="Example: I couldn't wake up early for my run..." />
        </label>
        <label>
          What helped you improve?
          <textarea placeholder="Example: I prepared shoes and clothes at night." />
        </label>
        <label>
          What problem remained, and how did you overcome it?
          <textarea placeholder="Share your practical fix for others." />
        </label>
        <button className="primary-btn" type="button">
          Save Journey
        </button>
      </article>
    </section>
  );
}

export default JourneyNewPage;
