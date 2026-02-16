import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LayoutDashboard, Server, Shield, LogOut, Search, AlertCircle } from 'lucide-react';
import api from './api';
import Hosts from './pages/Hosts';
import ScanDetail from './pages/ScanDetail';
import GlobalSearch from './pages/GlobalSearch';

const Auth = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(null); // null means loading
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const checkUserCount = async () => {
      try {
        const response = await api.get('/users/count');
        const count = response.data.count;
        setUserCount(count);
        setIsLogin(count > 0);
        setApiError(false);
      } catch (err) {
        console.error('Failed to check user count', err);
        setApiError(true);
      }
    };
    checkUserCount();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const response = await api.post('/token', formData);
        localStorage.setItem('token', response.data.access_token);
        setToken(response.data.access_token);
      } else {
        await api.post('/register', { username, password });
        // After registration, login automatically
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const response = await api.post('/token', formData);
        localStorage.setItem('token', response.data.access_token);
        setToken(response.data.access_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || (isLogin ? 'Invalid username or password' : 'Registration failed'));
    }
  };

  if (apiError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-red-900/50 text-center">
          <div className="bg-red-900/20 p-3 rounded-full mb-4 inline-block">
            <AlertCircle className="text-red-500 size-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-6">
            Unable to connect to the backend API at <br/>
            <code className="text-xs bg-black/30 p-1 rounded mt-1 inline-block">{api.defaults.baseURL}</code>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg font-bold transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isLogin === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600/20 p-3 rounded-full mb-4">
            <Shield className="text-blue-500 size-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight text-center">
            {isLogin ? 'Welcome Back' : 'Create Admin Account'}
          </h2>
          <p className="text-gray-400 mt-2 text-sm text-center">
            {isLogin ? 'Enter your credentials to access NFI' : 'Set up the initial administrator user'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm flex items-center">
            <AlertCircle className="mr-2 size-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-300">Username</label>
            <input
              type="text"
              className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              placeholder="admin"
              autoComplete={isLogin ? "username" : "new-password"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-300">Password</label>
            <input
              type="password"
              className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold transition shadow-lg shadow-blue-900/20">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {userCount > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:text-blue-400 text-sm font-medium transition"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [hosts, setHosts] = useState([]);

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const response = await api.get('/hosts');
        setHosts(response.data);
      } catch (err) {
        console.error('Failed to fetch hosts');
      }
    };
    fetchHosts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Network Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Hosts</h3>
          <p className="text-4xl font-bold">{hosts.length}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Last Scans</h3>
          <p className="text-4xl font-bold text-green-500">0</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Alerts</h3>
          <p className="text-4xl font-bold text-red-500">0</p>
        </div>
      </div>

      <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Monitored Hosts</h2>
          <Link to="/hosts" className="text-blue-500 hover:text-blue-400 text-sm font-medium">View All</Link>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-700 text-gray-300 text-xs uppercase">
            <tr>
              <th className="p-4">Hostname</th>
              <th className="p-4">IP Address</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {hosts.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">No hosts added yet</td>
              </tr>
            ) : (
              hosts.map(host => (
                <tr key={host.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="p-4 font-medium">{host.hostname}</td>
                  <td className="p-4">{host.ip_address}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">Active</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Layout = ({ children, setToken }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-gray-700 flex items-center">
          <Shield className="mr-2 text-blue-500" /> NFI
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <Link to="/" className="flex items-center p-2 hover:bg-gray-700 rounded transition">
            <LayoutDashboard className="mr-3 size-5" /> Dashboard
          </Link>
          <Link to="/hosts" className="flex items-center p-2 hover:bg-gray-700 rounded transition">
            <Server className="mr-3 size-5" /> Hosts
          </Link>
          <Link to="/search" className="flex items-center p-2 hover:bg-gray-700 rounded transition">
            <Search className="mr-3 size-5" /> Search
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="flex items-center w-full p-2 hover:bg-red-900 text-red-400 rounded transition">
            <LogOut className="mr-3 size-5" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  if (!token) {
    return <Auth setToken={setToken} />;
  }

  return (
    <Router>
      <Layout setToken={setToken}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hosts" element={<Hosts />} />
          <Route path="/scans/:scanId" element={<ScanDetail />} />
          <Route path="/search" element={<GlobalSearch />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
