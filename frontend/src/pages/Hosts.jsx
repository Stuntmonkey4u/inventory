import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Server, Key, User, Globe, Play, History, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

const Hosts = () => {
  const [hosts, setHosts] = useState([]);
  const [scans, setScans] = useState({}); // { hostId: [scans] }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newHost, setNewHost] = useState({
    hostname: '',
    ip_address: '',
    ssh_user: '',
    ssh_password: '',
    ssh_key: ''
  });

  const fetchHosts = async () => {
    try {
      const response = await api.get('/hosts');
      setHosts(response.data);
      // Fetch recent scans for each host
      response.data.forEach(host => {
        fetchScans(host.id);
      });
    } catch (err) {
      console.error('Failed to fetch hosts');
    }
  };

  const fetchScans = async (hostId) => {
    try {
      const response = await api.get(`/hosts/${hostId}/scans`);
      setScans(prev => ({ ...prev, [hostId]: response.data }));
    } catch (err) {
      console.error(`Failed to fetch scans for host ${hostId}`);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  // Polling for running scans
  useEffect(() => {
    const hasRunningScan = Object.values(scans).some(hostScans =>
      hostScans.length > 0 && hostScans[0].status === 'running'
    );

    if (hasRunningScan) {
      const interval = setInterval(() => {
        // Re-fetch all hosts to get updated scan statuses
        fetchHosts();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [scans]);

  const handleAddHost = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/hosts', newHost);
      setIsModalOpen(false);
      setNewHost({ hostname: '', ip_address: '', ssh_user: '', ssh_password: '', ssh_key: '' });
      fetchHosts();
    } catch (err) {
      alert('Failed to add host');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this host?')) return;
    try {
      await api.delete(`/hosts/${id}`);
      fetchHosts();
    } catch (err) {
      alert('Failed to delete host');
    }
  };

  const handleRunScan = async (id) => {
    try {
      await api.post(`/hosts/${id}/scan`);
      // Refresh scans for this host immediately
      fetchScans(id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to trigger scan');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Server className="mr-3 text-blue-500" /> Host Management
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-bold transition"
        >
          <Plus size={20} className="mr-2" /> Add Host
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700 text-gray-300 text-xs uppercase">
            <tr>
              <th className="p-4">Hostname</th>
              <th className="p-4">IP Address</th>
              <th className="p-4">SSH User</th>
              <th className="p-4">Last Scan</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hosts.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500 italic">
                  No hosts found. Click "Add Host" to get started.
                </td>
              </tr>
            ) : (
              hosts.map(host => (
                <tr key={host.id} className="border-b border-gray-700 hover:bg-gray-750 transition">
                  <td className="p-4 font-medium">{host.hostname}</td>
                  <td className="p-4 font-mono text-sm">{host.ip_address}</td>
                  <td className="p-4 flex items-center">
                    <User size={14} className="mr-2 text-gray-400" /> {host.ssh_user}
                  </td>
                  <td className="p-4">
                    {scans[host.id] && scans[host.id].length > 0 ? (
                      scans[host.id][0].status === 'running' ? (
                        <div className="flex items-center text-blue-400">
                          <Loader2 className="animate-spin mr-2" size={16} />
                          <span className="text-xs font-medium">updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {scans[host.id][0].status === 'success' ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <XCircle size={16} className="text-red-500" />
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(scans[host.id][0].timestamp).toLocaleString()}
                          </span>
                          <Link
                            to={`/scans/${scans[host.id][0].id}`}
                            className="text-blue-500 hover:text-blue-400"
                          >
                            <FileText size={14} />
                          </Link>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-gray-500">No scans yet</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleRunScan(host.id)}
                      disabled={scans[host.id] && scans[host.id].length > 0 && scans[host.id][0].status === 'running'}
                      title="Run Scan"
                      className="p-2 text-green-500 hover:bg-green-900/30 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Play size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteHost(host.id)}
                      className="p-2 text-red-500 hover:bg-red-900/30 rounded transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Host"
      >
        <form onSubmit={handleAddHost} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Hostname</label>
            <div className="relative">
              <Server className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 pl-10 text-white outline-none focus:border-blue-500"
                placeholder="e.g. web-server-01"
                value={newHost.hostname}
                onChange={e => setNewHost({...newHost, hostname: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">IP Address</label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 pl-10 text-white outline-none focus:border-blue-500"
                placeholder="e.g. 192.168.1.10"
                value={newHost.ip_address}
                onChange={e => setNewHost({...newHost, ip_address: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">SSH User</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 pl-10 text-white outline-none focus:border-blue-500"
                placeholder="e.g. root or admin"
                value={newHost.ssh_user}
                onChange={e => setNewHost({...newHost, ssh_user: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">SSH Password (Optional)</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="password"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 pl-10 text-white outline-none focus:border-blue-500"
                placeholder="Leave blank if using keys"
                value={newHost.ssh_password}
                onChange={e => setNewHost({...newHost, ssh_password: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">SSH Private Key (Optional)</label>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-blue-500 h-24 font-mono text-xs"
              placeholder="-----BEGIN RSA PRIVATE KEY-----..."
              value={newHost.ssh_key}
              onChange={e => setNewHost({...newHost, ssh_key: e.target.value})}
            ></textarea>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mr-3 text-gray-400 hover:text-white px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Host'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Hosts;
