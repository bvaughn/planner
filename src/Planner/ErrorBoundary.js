import { Component } from "react";
import styles from "./ErrorBoundary.module.css";

export default class ErrorBoundary extends Component {
  state = {
    error: null,
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { resetErrorBoundary } = this.props;
    const { error } = this.state;

    if (error !== null) {
      return (
        <div style={{ width: this.props.width }}>
          <div className={styles.ErrorHeader}>Something went wrong:</div>
          <pre className={styles.ErrorMessage}>{error.stack}</pre>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}
