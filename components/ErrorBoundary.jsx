import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Townhall error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: "#0F0E0C",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 16,
          fontFamily: "'DM Sans', sans-serif", padding: 24,
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#F2EDE4" }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, color: "#9A9188", textAlign: "center", lineHeight: 1.7 }}>
            Townhall hit an unexpected error.<br/>Try refreshing the page.
          </div>
          <button onClick={() => window.location.reload()} style={{
            background: "#D4922A", color: "#0F0E0C", border: "none",
            borderRadius: 8, padding: "10px 24px",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer",
          }}>
            Refresh
          </button>
          {process.env.NODE_ENV === "development" && (
            <pre style={{ fontSize: 11, color: "#4A4640", maxWidth: 600, overflow: "auto" }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
