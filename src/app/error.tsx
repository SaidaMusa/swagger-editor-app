"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="card stack" role="alert">
      <h1>Something went wrong</h1>
      <p className="error-text">The application hit an unexpected problem. Please try again.</p>
      <button className="button primary" onClick={reset} type="button">
        Reload section
      </button>
    </section>
  );
}
