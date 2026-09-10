"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
const router = useRouter();

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [mobile, setMobile] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

async function handleRegister(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setError("");

if (password !== confirmPassword) {
  setError("Passwords do not match.");
  return;
}

try {
  setLoading(true);

  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      mobile,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    setError(data.error || "Registration failed.");
    return;
  }

  alert("Account created successfully!");

  router.push("/login");
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
        Create Account
      </h1>

      <p className="text-gray-500 mt-2">
        Join SKART and start shopping
      </p>

    </div>

    <div className="bg-white rounded-2xl shadow-lg border p-8">

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      <form
        onSubmit={handleRegister}
        className="space-y-5"
      >

        <div>
          <label className="block font-semibold mb-2">
            Full Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
            Mobile Number
          </label>

          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Enter your mobile number"
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
            placeholder="Minimum 6 characters"
            required
            minLength={6}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm your password"
            required
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

      </form>

      <div className="text-center mt-6 text-gray-600">

        Already have an account?{" "}

        <Link
          href="/login"
          className="text-blue-600 font-semibold hover:underline"
        >
          Login
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
