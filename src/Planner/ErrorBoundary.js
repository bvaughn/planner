import { ErrorBoundary } from "react-error-boundary";
import styles from "./ErrorBoundary.module.css";

export default function ErrorBoundaryWrapper({ children, resetError }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={resetError}>
      {children}
    </ErrorBoundary>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <>
      <div className={styles.ErrorHeader}>Something went wrong:</div>
      <pre className={styles.ErrorMessage}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </>
  );
}
