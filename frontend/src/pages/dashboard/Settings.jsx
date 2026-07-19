import { useEffect, useState } from "react";
import API from "../../services/api";

export default function Settings() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    API.get("/expert-system/me").then(res => setConfig(res.data));
  }, []);

  async function updateFallback(type) {
    const res = await API.patch("/expert-system/me", { fallbackType: type });
    setConfig(res.data);
  }

  if (!config) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
        <div>
          <label className="block font-medium mb-2">AI Fallback Strategy</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => updateFallback('faq_only')}
              className={`p-4 rounded-lg border-2 text-left ${config.fallbackType === 'faq_only' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100'}`}
            >
              <p className="font-bold">Strict FAQ</p>
              <p className="text-xs text-gray-500">Only replies if keywords match exactly.</p>
            </button>
            <button 
              onClick={() => updateFallback('gpt')}
              className={`p-4 rounded-lg border-2 text-left ${config.fallbackType === 'gpt' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100'}`}
            >
              <p className="font-bold">GPT Hybrid</p>
              <p className="text-xs text-gray-500">Uses AI to rephrase answers (Recommended).</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}