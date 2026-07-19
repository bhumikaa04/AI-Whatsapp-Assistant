// pages/dashboard/ExpertSystem/FAQ.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../../../services/api";
import FAQForm from "./FAQForm";

export default function FAQs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null); // Track loader state for specific item deletion
  const [query, setQuery] = useState("");

  // Fetch the current user's active FAQ data array
  const fetchFAQs = () => {
    setLoading(true);
    API.get("/faqs")
      .then((res) => setFaqs(res.data))
      .catch((err) => console.error("Error loading FAQs:", err))
      .finally(() => setLoading(false));
  };

  // 🔥 Handle FAQ Deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ entry?")) return;

    setDeletingId(id);
    try {
      await API.delete(`/faqs/${id}`);
      // Refresh the list locally right after deletion success
      fetchFAQs();
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      alert("Failed to delete the FAQ entry. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const filteredFaqs = useMemo(() => {
    const sorted = [...faqs].sort((a, b) => (b.priority || 1) - (a.priority || 1));
    if (!query.trim()) return sorted;
    const q = query.trim().toLowerCase();
    return sorted.filter(
      (faq) =>
        faq.question?.toLowerCase().includes(q) ||
        faq.answer?.toLowerCase().includes(q) ||
        faq.keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [faqs, query]);

  const avgPriority = faqs.length
    ? (faqs.reduce((sum, f) => sum + (f.priority || 1), 0) / faqs.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Expert System Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Train your WhatsApp assistant by defining specific FAQ rules and matching boundaries.
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-3">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm min-w-[88px]">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Entries</p>
            <p className="text-lg font-semibold text-indigo-900">{faqs.length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm min-w-[88px]">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Avg Priority</p>
            <p className="text-lg font-semibold text-indigo-900">{avgPriority}</p>
          </div>
        </div>
      </div>

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Stored Knowledge List (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-gray-800">
              Active FAQ Set
              <span className="ml-1.5 text-sm font-normal text-gray-400">({filteredFaqs.length})</span>
            </h2>

            <div className="relative w-56">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entries..."
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white p-5 rounded-xl border border-gray-100 animate-pulse space-y-3"
                >
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-dashed border-gray-200 text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-indigo-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">No FAQs added yet</p>
              <p className="text-gray-400 text-sm">Use the training panel to seed your assistant's knowledge.</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center">
              <p className="text-gray-500 text-sm">No entries match "{query}".</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq._id}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-2.5 group relative transition hover:border-indigo-100 hover:shadow-md"
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-medium text-indigo-900 leading-snug">
                      <span className="text-indigo-300 font-mono text-xs mr-1.5 align-middle">Q</span>
                      {faq.question}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                          (faq.priority || 1) >= 14
                            ? "bg-indigo-100 text-indigo-700"
                            : (faq.priority || 1) >= 7
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        P{faq.priority || 1}
                      </span>

                      {/* Delete Action Button */}
                      <button
                        onClick={() => handleDelete(faq._id)}
                        disabled={deletingId === faq._id}
                        className="text-gray-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete FAQ"
                      >
                        {deletingId === faq._id ? (
                          <span className="text-xs animate-pulse text-red-500 px-0.5">...</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.34 6m-4.74 0L9 9m13 1.5c0 1.03-.07 2.05-.22 3.05-.33 2.23-2.22 3.95-4.56 3.95A48.108 48.108 0 0 1 12 20.5c-2.38 0-4.52-1.21-5.42-3.42a47.902 47.902 0 0 1-.22-3.05c-.14-1-.22-2.02-.22-3.05v-.5c0-1.02.08-2.04.22-3.05l.02-.12a4.814 4.814 0 0 1 4.75-3.87h4.44a4.814 4.814 0 0 1 4.75 3.87l.02.12c.14 1 .22 2.03.22 3.05v.5ZM9 4h6"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed pl-5">
                    <span className="text-gray-300 font-mono text-xs mr-1.5 align-middle">A</span>
                    {faq.answer}
                  </p>

                  {faq.keywords && faq.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2.5 border-t border-gray-50 pl-5">
                      {faq.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="bg-gray-50 text-gray-500 text-xs px-2 py-0.5 rounded-md border border-gray-100"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Training Form Input (Spans 1 column) */}
        <div className="lg:sticky lg:top-6">
          <FAQForm onSuccess={fetchFAQs} />
        </div>
      </div>
    </div>
  );
}