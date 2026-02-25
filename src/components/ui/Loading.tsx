export const Loading = ({ label = "Loading..." }: { label?: string }) => {
  return (
    <div className="loading-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
};
