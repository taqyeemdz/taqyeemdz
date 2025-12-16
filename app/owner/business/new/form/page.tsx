"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FeedbackForm() {
  const params = useSearchParams();
  const businessId = params.get("b");
  const qrCode = params.get("q");

  const [rating, setRating] = useState("");

  async function submit(e: { preventDefault: () => void; }) {
    e.preventDefault();

    await fetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        business_id: businessId,
        qr_code: qrCode,
        rating
      }),
    });

    alert("Thanks for your feedback!");
  }

  return (
    <form onSubmit={submit} className="p-6">
      <h1>Your Feedback</h1>

      <select onChange={(e) => setRating(e.target.value)} required>
        <option value="">Select rating</option>
        <option value="1">Good</option>
        <option value="2">Medium</option>
        <option value="3">Bad</option>
      </select>

      <button className="bg-emerald-500 text-white p-3 mt-4 rounded">
        Submit
      </button>
    </form>
  );
}
