"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

async function handleLogin(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setError("");

try {
  setLoading(true);

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    setError(data.error || "Login failed.");
    return;
  }

  router.push("/");
  router.refresh();
} catch (error) {
  console.error(error);
  setError("Something went wrong. Please try again.");
} finally {
  setLoading(false);
}

}

return ( <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">

  <div className="w-full max-w-md">

    <div className="text-center mb-8">

      <Link
        href="/"
        className="text-3xl font-bold text-blue-600"
      >
        SKART
      </Link>

      <h1 className="text-3xl font-bold mt-6">
        Welcome Back
      </h1>

      <p className="text-gray-500 mt-2">
        Login to your SKART account
      </p>

    </div>

    <div className="bg-white rounded-2xl shadow-lg border p-8">

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      <form
        onSubmit={handleLogin}
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
            placeholder="Enter your email"
            required
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

      <div className="text-center mt-6 text-gray-600">

        Don't have an account?{" "}

        <Link
          href="/register"
          className="text-blue-600 font-semibold hover:underline"
        >
          Create Account
        </Link>

      </div>

    </div>

    <div className="text-center mt-6">

      <Link
        href="/"
        className="text-gray-500 hover:text-blue-600"
      >
        ← Back to Shop
      </Link>

    </div>

  </div>

</main>

);
}
