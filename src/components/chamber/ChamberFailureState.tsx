export type ChamberFailureStateProps = {
  error?: string;
  onRetry: () => void;
  onBackToCapture: () => void;
};

export default function ChamberFailureState({ error, onRetry, onBackToCapture }: ChamberFailureStateProps) {
  return (
    <section className="chamber-failure" aria-live="assertive">
      <p className="chamber-failure__label">PRESERVATION INTERRUPTED</p>
      <h2>The record could not be formed from this source evidence.</h2>
      {error ? <p className="chamber-failure__technical">{error}</p> : null}
      <div className="chamber-action-grid">
        <button type="button" onClick={onRetry} className="chamber-action chamber-action--primary">
          Retry Preservation
        </button>
        <button type="button" onClick={onBackToCapture} className="chamber-action">
          Return to Preserve
        </button>
      </div>
    </section>
  );
}
