import { Component } from "react";
import ErrorState from "./ErrorState";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "Uncaught runtime error captured by ErrorBoundary:",
      error,
      errorInfo,
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "32px 16px",
            maxWidth: "680px",
            margin: "40px auto",
          }}
        >
          <ErrorState
            title="Module Render Issue Detected"
            message={
              this.state.error?.message ||
              "An unexpected client-side error occurred while rendering this module. You can reload this view safely."
            }
            onRetry={this.handleReset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
