/** A marked script line: ‖ is a pause, **word** is stressed. */
export function VoiceLine({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|‖)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p === "‖" ? (
          <span key={i} style={{ color: "var(--signal-ink)" }}>
            ‖
          </span>
        ) : p.startsWith("**") ? (
          <b key={i}>{p.slice(2, -2)}</b>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
