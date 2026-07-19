// src/pages/dashboard/BusinessProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Tag, FileText, Settings, Globe, AlertCircle, Save, X, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/config';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' }
});

export default function BusinessProfile() {
  const { user, refreshSync } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    products: [],
    services: [],
    policies: [],
    additionalInstructions: '',
    tone: 'Professional',
    language: 'English'
  });

  const [newProduct, setNewProduct] = useState('');
  const [newService, setNewService] = useState('');
  const [newPolicy, setNewPolicy] = useState('');

  // 🚀 FALLBACK CRITICAL FIX: If expertSystemID isn't initialized yet, 
  // fall back to using the direct User database _id to prevent infinite loops.
  const contextID = user?.expertSystemID || user?._id;

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🚀 AUTHENTICATION FIX: Fetch fresh Firebase token for backend access verification
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }
      const token = await firebaseUser.getIdToken();

      const response = await api.get(`/business-profile?expertSystemID=${contextID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormData({
          businessName: response.data.businessName || '',
          businessDescription: response.data.businessDescription || '',
          products: response.data.products || [],
          services: response.data.services || [],
          policies: response.data.policies || [],
          additionalInstructions: response.data.additionalInstructions || '',
          tone: response.data.tone || 'Professional',
          language: response.data.language || 'English'
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('ℹ️ No existing business profile found. Ready for creation.');
      } else {
        console.error('❌ Error fetching profile:', err);
        setError('Failed to load business profile configurations.');
      }
    } finally {
      setLoading(false); // 🚀 This stops the infinite loading loop guaranteed
    }
  }, [contextID]);

  useEffect(() => {
    if (contextID) {
      fetchProfile();
    } else if (user) {
      // User data is loaded but has absolutely no identification parameters
      setError('No valid business or user identifier found context mappings.');
      setLoading(false);
    }
  }, [contextID, user, fetchProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (!contextID) {
        setError('Cannot save: Identification profile index context is missing.');
        setSaving(false);
        return;
      }

      const firebaseUser = auth.currentUser;
      const token = await firebaseUser.getIdToken();

      await api.post('/business-profile', 
        { ...formData, expertSystemID: contextID },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await refreshSync();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('❌ Error saving business profile:', err);
      setError(err.response?.data?.error || 'Failed to preserve workspace settings updates.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = (type, value) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }));
    if (type === 'products') setNewProduct('');
    if (type === 'services') setNewService('');
    if (type === 'policies') setNewPolicy('');
  };

  const removeItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value;
      addItem(type, value);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-white border border-slate-150 rounded-xl p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Syncing operational business parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Business Profile</h1>
          <p className="text-sm text-slate-500">
            Configure your business details to personalize your AI assistant's responses
          </p>
        </div>
        <span className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200">
          <Briefcase className="inline-block w-3 h-3 mr-1" />
          Setup Engine
        </span>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-rose-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start">
          <Save className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-600 text-sm">Business profile saved successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Replyly Mainhouse"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Business Description</label>
              <textarea
                name="businessDescription"
                value={formData.businessDescription}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Describe what your business does..."
              />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <Tag className="w-4 h-4 mr-2 text-indigo-600" /> Products
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'products')}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add a product (press Enter)"
            />
            <button
              type="button"
              onClick={() => addItem('products', newProduct)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.products.map((product, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-200">
                {product}
                <button type="button" onClick={() => removeItem('products', index)} className="hover:text-rose-600 transition"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <Briefcase className="w-4 h-4 mr-2 text-indigo-600" /> Services
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'services')}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add a service (press Enter)"
            />
            <button
              type="button"
              onClick={() => addItem('services', newService)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.services.map((service, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">
                {service}
                <button type="button" onClick={() => removeItem('services', index)} className="hover:text-rose-600 transition"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-indigo-600" /> Policies
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newPolicy}
              onChange={(e) => setNewPolicy(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'policies')}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add a policy (press Enter)"
            />
            <button
              type="button"
              onClick={() => addItem('policies', newPolicy)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.policies.map((policy, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200">
                {policy}
                <button type="button" onClick={() => removeItem('policies', index)} className="hover:text-rose-600 transition"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Additional Instructions */}
        <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <Settings className="w-4 h-4 mr-2 text-indigo-600" /> Additional Instructions
          </h2>
          <textarea
            name="additionalInstructions"
            value={formData.additionalInstructions}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Any specific instructions for your AI assistant..."
          />
        </div>

        {/* Tone & Language */}
        <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <Globe className="w-4 h-4 mr-2 text-indigo-600" /> Communication Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tone</label>
              <select name="tone" value={formData.tone} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Casual">Casual</option>
                <option value="Formal">Formal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
              <select name="language" value={formData.language} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {saving ? 'Preserving Matrix...' : 'Save Business Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}