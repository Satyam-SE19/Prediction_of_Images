import React, { useState } from 'react';
import { Search, Globe, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
import { searchLivestockNews } from '../services/geminiService.js';

const MarketSearch = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchLivestockNews(query);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Current cattle prices in Texas",
    "Foot and mouth disease outbreaks 2024",
    "Best buffalo milk prices"
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
       <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" /> Market Intelligence
          </h2>
          <p className="opacity-90 mt-1">Real-time search grounded by World Analysis</p>
       </div>

       <div className="p-6">
          <form onSubmit={handleSearch} className="relative mb-6">
            <input 
              type="text" 
              placeholder="Search market trends, disease alerts..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <button 
              type="submit" 
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {!result && !loading && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2 font-medium">Trending Searches:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => (
                  <button 
                    key={s}
                    onClick={() => { setQuery(s); }}
                    className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <TrendingUp className="w-3 h-3" /> {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fadeIn">
              <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {result.text}
              </div>
              
              {result.sources.length > 0 && (
                <div>
                   <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sources</h4>
                   <div className="grid gap-2">
                     {result.sources.map((source, idx) => (
                       <a 
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
                       >
                         <span className="text-sm font-medium text-blue-600 truncate flex-1 mr-4">{source.title}</span>
                         <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                       </a>
                     ))}
                   </div>
                </div>
              )}
            </div>
          )}
       </div>
    </div>
  );
};

export default MarketSearch;