// pages/dashboard/ExpertSystem/FAQForm.jsx
import { useState } from "react";
import API from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

export default function FAQForm({ onSuccess }) {
  const {user} = useAuth(); 
  const [form, setForm] = useState({
    question: "",
    answer: "",
    keywords: "",
    priority: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const SystemID = user?._id || user?.expertSystemID;

  async function submit(e) {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (!form.question.trim() || !form.answer.trim()) {
      setError("Both Question and Answer fields are required.");
      return;
    }

    setLoading(true);

    // Prepare payload data structures
    const payload = {
      expertSystemID: SystemID, 
      question: form.question.trim(),
      answer: form.answer.trim(),
      priority: Number(form.priority),
      // Clean comma-separated text into a clean array of strings
      keywords: form.keywords
        ? form.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean)
        : [],
    };

    try {
      // POST directly to your FAQ backend endpoint
      await API.post("/faqs", payload);
      
      // Reset form on success
      setForm({ question: "", answer: "", keywords: "", priority: 1 });
      
      // 💡 Trigger parent list refresh callback function if provided
      if (onSuccess) {
        onSuccess();
      } else {
        alert("FAQ added successfully!");
      }
    } catch (err) {
      console.error("Error creating knowledge base entry:", err);
      setError(err.response?.data?.message || "Failed to save the knowledge entry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Train Your Assistant</h2>
      
      <form onSubmit={submit} className="bg-white p-6 rounded-xl border border-gray-100 space-y-4 shadow-sm">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Inbound Question Intent
          </label>
          <input
            type="text"
            name="question"
            placeholder="e.g., What are your store hours?"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            AI Automated Response
          </label>
          <textarea
            name="answer"
            placeholder="e.g., We are open Monday to Friday from 9 AM to 6 PM."
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-32 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Intent Keywords (Optional)
          </label>
          <input
            type="text"
            name="keywords"
            placeholder="price, cost, timing, hours (comma separated)"
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={loading}
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            <span>Match Priority Resolution</span>
            <span className="text-indigo-600 font-mono text-sm">{form.priority}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 active:bg-indigo-800 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Syncing Vectors..." : "Save Knowledge Entry"}
        </button>
      </form>
    </div>
  );
}