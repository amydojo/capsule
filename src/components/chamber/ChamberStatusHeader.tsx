export type ChamberStatusHeaderProps = {
  objectLabel: string;
  statusLine: string;
  isReady: boolean;
  isFailed: boolean;
  onReturnToVault: () => void;
  onNewSource?: () => void;
  showNewSource?: boolean;
};

export default function ChamberStatusHeader({
  objectLabel,
  statusLine,
  isReady,
  isFailed,
  onReturnToVault,
  onNewSource,
  showNewSource = false,
}: ChamberStatusHeaderProps) {
  const title = isFailed ? "PRESERVATION INTERRUPTED" : isReady ? "REVIEW READY" : "PRESERVATION CHAMBER";

  return (
    <header className="chamber-status-header">
      <button type="button" className="chamber-icon-button" aria-label="Return to Vault" onClick={onReturnToVault}>
        x
      </button>
      <div className="chamber-status-header__copy">
        <p className="chamber-eyebrow">PRESERVATION CHAMBER</p>
        <h1>{title}</h1>
        <p className="chamber-status-header__object">{objectLabel}</p>
        <p className="chamber-status-header__line" aria-live="polite">
          {statusLine}
        </p>
      </div>
      {showNewSource && onNewSource ? (
        <button type="button" className="chamber-icon-button" aria-label="New source evidence" onClick={onNewSource}>
          +
        </button>
      ) : (
        <span className="chamber-icon-button chamber-icon-button--empty" aria-hidden="true" />
      )}
    </header>
  );
}
