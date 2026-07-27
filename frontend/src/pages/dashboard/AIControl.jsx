import React, { useState, useEffect, useCallback } from 'react';
import API from "../../services/api";
import { useAuth } from '../../context/AuthContext';

export default function AIControl() {
  const { user } = useAuth(); 
  const [pendingResponses, setPendingResponses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editAnswerText, setEditAnswerText] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Extract systemID safely from authenticated user context
  const systemID = user?.expertSystemID || user?._id;

  // Memoize fetch function to prevent re-render loops
  const fetchPendingQueue = useCallback(async () => {
    if (!systemID) return;
    
    try {
      setLoading(true);
      const response = await API.get(`/pending-ai/queue?expertSystemID=${systemID}`);
      const data = response.data;
      
      if (Array.isArray(data)) {
        setPendingResponses(data);
      } else if (Array.isArray(data?.queue)) {
        setPendingResponses(data.queue);
      } else if (data?.groupedQueue && typeof data.groupedQueue === 'object') {
        const flatList = Object.values(data.groupedQueue).flat();
        setPendingResponses(flatList);
      } else {
        console.error("Unrecognized queue payload structure:", data);
        setPendingResponses([]);
      }
    } catch (err) {
      console.error("Error fetching AI review queue:", err);
      setPendingResponses([]);
    } finally {
      setLoading(false);
    }
  }, [systemID]); 

  useEffect(() => {
    fetchPendingQueue();
  }, [fetchPendingQueue]);

  const handleApprove = async (id) => {
    try {
      setActionLoadingId(id);
      await API.post(`/pending-ai/${id}/approve`);
      // Optimistic update: filter out approved item instantly
      setPendingResponses(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("Failed to approve item:", err);
      alert("Failed to approve item. Check console for details.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoadingId(id);
      await API.post(`/pending-ai/${id}/reject`);
      // Optimistic update: filter out rejected item instantly
      setPendingResponses(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("Failed to reject item:", err);
      alert("Failed to reject item.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      setActionLoadingId(id);
      await API.post(`/pending-ai/${id}/edit`, { 
        editedQuestion: editQuestionText,
        editedAnswer: editAnswerText 
      });
      setEditingId(null);
      // Remove or refresh queue after edit and approve
      setPendingResponses(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("Failed to update edited response:", err);
      alert("Failed to save and approve edits.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const startEditing = (item) => {
    setEditingId(item._id);
    setEditQuestionText(item.primaryQuestion || item.question || "");
    setEditAnswerText(item.primaryResponse || item.generatedAnswer || "");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading AI human-review queue...
      </div>
    );
  }

  const safeQueueLength = Array.isArray(pendingResponses) ? pendingResponses.length : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Control & Staging Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve AI-generated FAQs before they enter your live WhatsApp knowledge base.
          </p>
        </div>
        <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200 shadow-sm">
          {safeQueueLength} Actions Required
        </span>
      </div>

      {safeQueueLength === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-600 font-semibold text-lg">All caught up! 🎉</p>
          <p className="text-xs text-slate-400 mt-1">
            No pending AI items require review right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingResponses.map((item) => {
            const questionText = item.primaryQuestion || item.question || "";
            const answerText = item.primaryResponse || item.generatedAnswer || "";
            const isProcessing = actionLoadingId === item._id;

            return (
              <div 
                key={item._id} 
                className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition hover:shadow-md ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    Category: {item.category || "General"}
                  </span>
                  <span className="text-xs text-slate-400">
                    Source: <strong className="text-slate-600">{item.source || "business_profile"}</strong>
                  </span>
                </div>

                {/* Question Section */}
                <div className="mb-3">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                    Question
                  </span>
                  {editingId === item._id ? (
                    <input
                      type="text"
                      className="w-full mt-1 p-2 border border-indigo-300 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editQuestionText}
                      onChange={(e) => setEditQuestionText(e.target.value)}
                    />
                  ) : (
                    <p className="text-slate-800 font-medium mt-1 text-sm bg-slate-50 p-2.5 rounded border border-slate-150">
                      "{questionText}"
                    </p>
                  )}
                </div>

                {/* Proposed Answer Section */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600">
                    Draft Answer
                  </span>
                  
                  {editingId === item._id ? (
                    <textarea
                      className="w-full mt-1 p-2 border border-indigo-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows="3"
                      value={editAnswerText}
                      onChange={(e) => setEditAnswerText(e.target.value)}
                    />
                  ) : (
                    <p className="text-slate-700 text-sm mt-1 bg-indigo-50/30 p-2.5 rounded border border-indigo-100/60 leading-relaxed">
                      {answerText}
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span>
                      Confidence: <strong className="text-emerald-600">{(item.confidence || 90).toFixed(0)}%</strong>
                    </span>
                  </div>
                  
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
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                        >
                          Save & Approve
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
            );
          })}
        </div>
      )}
    </div>
  );
}