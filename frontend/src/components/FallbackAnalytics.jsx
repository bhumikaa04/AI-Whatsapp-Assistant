// components/FallbackAnalytics.jsx
import { useState, useEffect } from 'react';
import { AlertCircle, Search, Calendar, Filter } from 'lucide-react';
import API from '../../../services/api';

export default function FallbackAnalytics() {
  const [fallbacks, setFallbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    fetchFallbacks();
  }, [filters]);

  const fetchFallbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const res = await API.get(`/leads/analytics/fallbacks?${params.toString()}`);
      setFallbacks(res.data);
    } catch (error) {
      console.error('Error fetching fallbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export to CSV functionality
    const csvData = fallbacks.map(fb => ({
      'Question': fb.text,
      'Lead': fb.leadId?.name || fb.leadId?.phone,
      'Date': new Date(fb.createdAt).toLocaleString(),
      'Response Type': fb.messageType
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fallback-queries.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fallback & Failed Queries</h1>
          <p className="text-gray-500">Analyze questions not matched by FAQ</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search failed queries..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="border rounded-lg px-3 py-2"
              placeholder="From"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="border rounded-lg px-3 py-2"
              placeholder="To"
            />
            <button
              onClick={fetchFallbacks}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-yellow-600">{fallbacks.length}</div>
          <div className="text-gray-500">Total Fallback Queries</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-gray-700">
            {new Set(fallbacks.map(fb => fb.leadId?._id)).size}
          </div>
          <div className="text-gray-500">Unique Users with Issues</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-blue-600">
            {fallbacks.filter(fb => fb.leadId?.tags?.includes('Interested')).length}
          </div>
          <div className="text-gray-500">From Interested Leads</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : fallbacks.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No fallback queries found
                </td>
              </tr>
            ) : (
              fallbacks.map((fb, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <div className="text-sm font-medium text-gray-900">{fb.text}</div>
                      {fb.response && (
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Bot response:</span> {fb.response}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {fb.leadId?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">{fb.leadId?.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      fb.messageType === 'fallback' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {fb.messageType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm">
                      Add to FAQ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}