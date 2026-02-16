import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, Box, Shield, Network, List, HardDrive, Cpu, Terminal } from 'lucide-react';
import api from '../api';

const DataSection = ({ title, icon: Icon, children }) => (
  <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
    <div className="bg-gray-750 px-4 py-3 border-b border-gray-700 flex items-center">
      <Icon className="mr-2 text-blue-500" size={18} />
      <h2 className="font-bold">{title}</h2>
    </div>
    <div className="p-4 overflow-auto max-h-96">
      {children}
    </div>
  </div>
);

const DataTable = ({ headers, rows }) => (
  <table className="w-full text-left text-sm">
    <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
      <tr>
        {headers.map(h => <th key={h} className="p-2">{h}</th>)}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/50">
          {row.map((cell, j) => <td key={j} className="p-2 font-mono">{cell}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
);

const ScanDetail = () => {
  const { scanId } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await api.get(`/scans/${scanId}`);
        setScan(response.data);
      } catch (err) {
        console.error('Failed to fetch scan detail');
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [scanId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!scan) return <div className="p-6 text-red-500">Scan not found</div>;

  const data = scan.data;

  if (scan.status === 'failed') {
    return (
      <div className="p-6">
        <Link to="/hosts" className="flex items-center text-blue-500 mb-6 hover:underline">
          <ArrowLeft size={16} className="mr-1" /> Back to Hosts
        </Link>
        <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Scan Failed</h1>
          <p className="mb-4">{data.error}</p>
          <div className="bg-black p-4 rounded font-mono text-xs whitespace-pre-wrap">
            {data.stdout}
            {data.stderr}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/hosts" className="flex items-center text-blue-500 mb-2 hover:underline">
            <ArrowLeft size={16} className="mr-1" /> Back to Hosts
          </Link>
          <h1 className="text-3xl font-bold">Forensic Report: {data.hostname}</h1>
          <p className="text-gray-400">{new Date(scan.timestamp).toLocaleString()} • {data.ip} • {data.os}</p>
        </div>
        <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-full border border-green-800 font-bold">
          Success
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataSection title="System Information" icon={Cpu}>
          <div className="space-y-2">
            <p><span className="text-gray-400">Boot Time:</span> {data.boot_time}</p>
            <p><span className="text-gray-400">Uptime:</span> {data.uptime}</p>
            <div className="mt-4">
               <h4 className="text-xs uppercase text-gray-500 mb-2 font-bold">Filesystem</h4>
               <pre className="text-xs bg-gray-900 p-2 rounded">{data.filesystem?.join('\n')}</pre>
            </div>
          </div>
        </DataSection>

        <DataSection title="Network: Listening Ports" icon={Network}>
          <pre className="text-xs font-mono">{data.listening_ports?.join('\n')}</pre>
        </DataSection>

        <DataSection title="Running Services" icon={Activity}>
          <ul className="text-xs space-y-1">
            {data.verified_services?.map((s, i) => (
              <li key={i} className="flex items-center">
                <span className="size-2 bg-green-500 rounded-full mr-2"></span>
                {s}
              </li>
            ))}
          </ul>
        </DataSection>

        <DataSection title="Docker Containers" icon={Box}>
          {data.docker === "Skipped" || !data.docker?.length ? (
            <p className="text-gray-500 italic text-sm">No containers found or skipped</p>
          ) : (
            <ul className="text-xs space-y-1">
              {data.docker.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
        </DataSection>
      </div>

      <DataSection title="Process List" icon={List}>
         <pre className="text-[10px] leading-tight font-mono whitespace-pre">
           {data.process_list?.join('\n')}
         </pre>
      </DataSection>

      <DataSection title="Security: SSH Keys" icon={Shield}>
        {data.ssh_keys === "Skipped" ? (
          <p className="text-gray-500 italic text-sm">Skipped</p>
        ) : (
          <div className="space-y-4">
            {data.ssh_keys?.map((key, i) => (
              <div key={i} className="border-b border-gray-700 pb-2 last:border-0">
                <h4 className="text-blue-400 font-bold text-sm mb-1">{key.user}</h4>
                <pre className="text-[10px] bg-gray-900 p-2 rounded break-all">{key.key}</pre>
              </div>
            ))}
          </div>
        )}
      </DataSection>
    </div>
  );
};

export default ScanDetail;
