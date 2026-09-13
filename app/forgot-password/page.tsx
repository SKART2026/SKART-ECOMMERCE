"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to process your request.");
        return;
      }

      setMessage(
        data.message ||
          "If an account exists with this email, a password reset link has been sent."
      );
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-bold text-blue-600"
          >
            SKART
          </Link>

          <h1 className="text-3xl font-bold mt-6">
            Forgot Password?
          </h1>

          <p className="text-gray-500 mt-2">
            Enter your registered email address and we'll send you a reset link.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border p-8">

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>
              <label className="block font-semibold mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

          </form>

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              ← Back to Login
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}