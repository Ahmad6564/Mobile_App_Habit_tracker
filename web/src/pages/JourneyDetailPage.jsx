import { useParams } from "react-router-dom";

function JourneyDetailPage() {
  const { journeyId } = useParams();

  return (
    <section className="stack">
      <h3>Journey Detail #{journeyId}</h3>
      <article className="card">
        <h4>How I fixed my consistency problem in 3 weeks</h4>
        <p>
          I failed my morning habit repeatedly because I depended on motivation. The game changer
          was reducing friction: one visible trigger, one tiny first action, and one accountability
          post every night.
        </p>
        <p>
          Biggest blocker: overplanning. Biggest win: keeping score daily and sharing short proof in
          community posts.
        </p>
      </article>
    </section>
  );
}

export default JourneyDetailPage;
