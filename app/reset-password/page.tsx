"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError("Invalid or missing password reset link.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to reset password.");
        return;
      }

      setMessage(
        "Password reset successfully. Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          padding: "35px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            SKART
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
              fontSize: "15px",
            }}
          >
            Create a new password
          </p>
        </div>

        {!token ? (
          <>
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              Invalid or missing password reset link.
            </div>

            <button
              onClick={() => router.push("/login")}
              style={{
                width: "100%",
                padding: "13px",
                border: "none",
                borderRadius: "8px",
                background: "#111827",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              New Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "13px",
                marginBottom: "16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />

            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "13px",
                marginBottom: "16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />

            {error && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                border: "none",
                borderRadius: "8px",
                background: loading ? "#9ca3af" : "#111827",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px",
                border: "none",
                background: "transparent",
                color: "#4b5563",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f7fb",
          }}
        >
          Loading...
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}