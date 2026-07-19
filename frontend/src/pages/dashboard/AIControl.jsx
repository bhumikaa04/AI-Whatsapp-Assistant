import React, { useState, useEffect } from 'react';
import API from "../../services/api";

export default function AIControl() {
  const [pendingResponses, setPendingResponses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch pending queue on load
  useEffect(() => {
    fetchPendingQueue();
  }, []);

  const fetchPendingQueue = async () => {
    try {
      setLoading(true);
      const response = await API.get('/pending-ai/queue');
      
      // FIX: Ensure response payload is an array before committing to state
      if (response.data && Array.isArray(response.data)) {
        setPendingResponses(response.data);
      } else if (response.data && Array.isArray(response.data.queue)) {
        // Fallback case if your controller wraps it in a nested key object
        setPendingResponses(response.data.queue);
      } else {
        console.error("Expected an array from backend API but received:", response.data);
        setPendingResponses([]);
      }
    } catch (err) {
      console.error("Error fetching AI review queue:", err);
      setPendingResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.post(`/pending-ai/${id}/approve`);
      setPendingResponses(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("Failed to approve item:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await API.post(`/pending-ai/${id}/reject`);
      setPendingResponses(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("Failed to reject item:", err);
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      await API.post(`/pending-ai/${id}/edit`, { editedAnswer: editText });
      setEditingId(null);
      fetchPendingQueue(); 
    } catch (err) {
      console.error("Failed to update edited response:", err);
    }
  };

  const startEditing = (item) => {
    setEditingId(item._id);
    setEditText(item.generatedAnswer);
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading AI human-review queue...</div>;
  }

  // Safe checks for mapping length logic 
  const safeQueueLength = Array.isArray(pendingResponses) ? pendingResponses.length : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Control</h1>
          <p className="text-sm text-slate-500">Review, edit, or approve Ollama's generated responses before they commit to permanent AI Knowledge bases.</p>
        </div>
        <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">
          {safeQueueLength} Actions Required
        </span>
      </div>

      {safeQueueLength === 0 ? (
        <div className="bg-white border border-slate-150 rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium">All caught up! 🎉</p>
          <p className="text-xs text-slate-400 mt-1">Ollama generations haven't hit exceptions or fallback conditions requiring manual review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingResponses.map((item) => (
            <div key={item._id} className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm transition hover:shadow-md">
              
              {/* Question Section */}
              <div className="mb-3">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Customer Asked
                </span>
                <p className="text-slate-800 font-medium mt-1 text-sm bg-slate-50 p-2 rounded border border-slate-100">
                  "{item.question}"
                </p>
              </div>

              {/* Proposed Answer Section */}
              <div className="mb-4">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                  Ollama's Draft Response
                </span>
                
                {editingId === item._id ? (
                  <textarea
                    className="w-full mt-2 p-2 border border-indigo-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                ) : (
                  <p className="text-slate-600 text-sm mt-1 bg-indigo-50/30 p-2 rounded border border-indigo-50/50">
                    {item.generatedAnswer}
                  </p>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Confidence Score: <span className="font-semibold text-emerald-600">{(item.confidence * 100)}%</span>
                </span>
                
                <div className="flex space-x-2">
                  {editingId === item._id ? (
                    <>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSaveEdit(item._id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                      >
                        Save & Commit
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleReject(item._id)}
                        className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={() => startEditing(item)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleApprove(item._id)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                      >
                        Approve & Learn
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}