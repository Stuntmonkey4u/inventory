import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Server, FileText, ArrowRight, Loader2, SearchX } from 'lucide-react';
import api from '../api';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
        setResults(response.data);
      } catch (err) {
        console.error('Search failed');
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [debouncedQuery]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Search className="mr-3 text-blue-500" /> Global Inventory Search
        </h1>
        <p className="text-gray-400">Search for programs, IP addresses, hostnames, or any system detail across your network.</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
        <input
          type="text"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 pl-12 text-white text-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-lg"
          placeholder="Search (e.g. 'nginx', '192.168', 'root')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {loading && (
          <div className="absolute right-4 top-4">
            <Loader2 className="animate-spin text-blue-500" size={20} />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((result, index) => (
            <div
              key={index}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="bg-gray-700 p-2 rounded-lg mr-4">
                    <Server className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition">
                      {result.host.hostname}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">{result.host.ip_address}</p>
                    <div className="flex items-center text-xs">
                      <span className={`px-2 py-0.5 rounded-full mr-2 ${
                        result.match_type === 'host' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'
                      }`}>
                        {result.match_type === 'host' ? 'Metadata Match' : 'Content Match'}
                      </span>
                      <span className="text-gray-500 italic">{result.snippet}</span>
                    </div>
                  </div>
                </div>
                {result.scan_id ? (
                  <Link
                    to={`/scans/${result.scan_id}`}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-md"
                  >
                    View Report <ArrowRight size={16} className="ml-2" />
                  </Link>
                ) : (
                  <Link
                    to="/hosts"
                    className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                  >
                    Go to Host <ArrowRight size={16} className="ml-2" />
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : query.length >= 2 && !loading ? (
          <div className="text-center py-12">
            <SearchX size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No results found for "{query}"</h3>
            <p className="text-gray-500">Try a different keyword or check your spelling.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GlobalSearch;
