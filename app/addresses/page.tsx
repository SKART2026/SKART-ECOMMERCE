"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Address = {
id: number;
userId: number;
fullName: string;
mobile: string;
address: string;
city: string;
state: string;
pincode: string;
};

export default function AddressesPage() {
const router = useRouter();

const [addresses, setAddresses] = useState<Address[]>([]);

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const [showForm, setShowForm] = useState(false);

const [fullName, setFullName] = useState("");
const [mobile, setMobile] = useState("");
const [address, setAddress] = useState("");
const [city, setCity] = useState("");
const [state, setState] = useState("");
const [pincode, setPincode] = useState("");

async function loadAddresses() {
try {
setLoading(true);
setError("");

  const response = await fetch("/api/addresses");

  if (response.status === 401) {
    router.push("/login");
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    setError(data.error || "Unable to load addresses.");
    return;
  }

  setAddresses(data.addresses);
} catch (error) {
  console.error(error);
  setError("Unable to load addresses.");
} finally {
  setLoading(false);
}

}

useEffect(() => {
loadAddresses();
}, []);

function clearForm() {
setFullName("");
setMobile("");
setAddress("");
setCity("");
setState("");
setPincode("");
}

async function handleAddAddress(
event: FormEvent<HTMLFormElement>
) {
event.preventDefault();

setError("");
setSuccess("");

try {
  setSaving(true);

  const response = await fetch("/api/addresses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName,
      mobile,
      address,
      city,
      state,
      pincode,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    setError(data.error || "Unable to add address.");
    return;
  }

  setSuccess("Address added successfully.");

  clearForm();
  setShowForm(false);

  await loadAddresses();
} catch (error) {
  console.error(error);
  setError("Unable to add address.");
} finally {
  setSaving(false);
}

}

async function handleDeleteAddress(id: number) {
const confirmed = window.confirm(
"Are you sure you want to delete this address?"
);

if (!confirmed) {
  return;
}

try {
  setError("");
  setSuccess("");

  const response = await fetch("/api/addresses", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    setError(data.error || "Unable to delete address.");
    return;
  }

  setSuccess("Address deleted successfully.");

  await loadAddresses();
} catch (error) {
  console.error(error);
  setError("Unable to delete address.");
}

}

return ( <main className="min-h-screen bg-gray-50 text-gray-900">

  {/* HEADER */}
  <header className="bg-white border-b">

    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

      <Link
        href="/"
        className="text-2xl font-bold text-blue-600"
      >
        SKART
      </Link>

      <Link
        href="/account"
        className="text-gray-600 hover:text-blue-600 font-semibold"
      >
        ← My Account
      </Link>

    </div>

  </header>

  {/* CONTENT */}
  <section className="max-w-5xl mx-auto px-6 py-12">

    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

      <div>

        <h1 className="text-4xl font-bold">
          My Addresses
        </h1>

        <p className="text-gray-500 mt-2">
          Manage your delivery addresses
        </p>

      </div>

      <button
        onClick={() => {
          setShowForm(!showForm);
          setError("");
          setSuccess("");
        }}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
      >
        {showForm ? "Cancel" : "+ Add New Address"}
      </button>

    </div>

    {error && (
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
        {error}
      </div>
    )}

    {success && (
      <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl p-4 mb-6">
        {success}
      </div>
    )}

    {/* ADD ADDRESS FORM */}
    {showForm && (
      <div className="bg-white border rounded-2xl shadow-sm p-8 mb-8">

        <h2 className="text-2xl font-bold mb-6">
          Add New Address
        </h2>

        <form
          onSubmit={handleAddAddress}
          className="space-y-5"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block font-semibold mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="Enter full name"
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
                onChange={(e) =>
                  setMobile(e.target.value)
                }
                placeholder="Enter mobile number"
                required
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          <div>
            <label className="block font-semibold mb-2">
              Address
            </label>

            <textarea
              value={address}
              onChange={(e) =>
                setAddress(e.target.value)
              }
              placeholder="House / Flat / Street / Area"
              required
              rows={3}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div>
              <label className="block font-semibold mb-2">
                City
              </label>

              <input
                type="text"
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
                placeholder="City"
                required
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                State
              </label>

              <input
                type="text"
                value={state}
                onChange={(e) =>
                  setState(e.target.value)
                }
                placeholder="State"
                required
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Pincode
              </label>

              <input
                type="text"
                value={pincode}
                onChange={(e) =>
                  setPincode(e.target.value)
                }
                placeholder="Pincode"
                required
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400"
          >
            {saving
              ? "Saving Address..."
              : "Save Address"}
          </button>

        </form>

      </div>
    )}

    {/* LOADING */}
    {loading && (
      <div className="bg-white border rounded-2xl p-12 text-center">

        <div className="text-5xl mb-4 animate-pulse">
          📍
        </div>

        <h2 className="text-xl font-bold">
          Loading addresses...
        </h2>

      </div>
    )}

    {/* EMPTY */}
    {!loading && addresses.length === 0 && (
      <div className="bg-white border rounded-2xl p-12 text-center">

        <div className="text-6xl mb-4">
          📍
        </div>

        <h2 className="text-2xl font-bold">
          No addresses saved
        </h2>

        <p className="text-gray-500 mt-2">
          Add your delivery address to make checkout faster.
        </p>

        <button
          onClick={() => setShowForm(true)}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
        >
          Add Address
        </button>

      </div>
    )}

    {/* ADDRESS LIST */}
    {!loading && addresses.length > 0 && (

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {addresses.map((item) => (

          <div
            key={item.id}
            className="bg-white border rounded-2xl p-6 shadow-sm"
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <h2 className="text-xl font-bold">
                  {item.fullName}
                </h2>

                <p className="text-gray-600 mt-1">
                  📱 {item.mobile}
                </p>

              </div>

              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                Delivery
              </span>

            </div>

            <div className="border-t mt-5 pt-5">

              <p className="text-gray-700 leading-7">
                {item.address}
                <br />
                {item.city}, {item.state}
                <br />
                {item.pincode}
              </p>

            </div>

            <button
              onClick={() =>
                handleDeleteAddress(item.id)
              }
              className="mt-6 text-red-600 font-semibold hover:underline"
            >
              Delete Address
            </button>

          </div>

        ))}

      </div>

    )}

  </section>

</main>

);
}
