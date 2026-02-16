import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, Box, Shield, Network, List, HardDrive, Cpu, Terminal, Diff, ChevronDown, ChevronUp, PlusCircle, MinusCircle, AlertCircle } from 'lucide-react';
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

const DiffSection = ({ title, fieldDiff }) => {
  if (!fieldDiff || (fieldDiff.added.length === 0 && fieldDiff.removed.length === 0)) return null;

  return (
    <div className="mb-4">
      <h4 className="text-sm font-bold text-gray-300 mb-2 uppercase">{title}</h4>
      <div className="space-y-1">
        {fieldDiff.added.map((item, i) => (
          <div key={`add-${i}`} className="flex items-center text-xs text-green-400 bg-green-900/20 p-1 rounded">
            <PlusCircle size={14} className="mr-2 flex-shrink-0" /> {item}
          </div>
        ))}
        {fieldDiff.removed.map((item, i) => (
          <div key={`rem-${i}`} className="flex items-center text-xs text-red-400 bg-red-900/20 p-1 rounded">
            <MinusCircle size={14} className="mr-2 flex-shrink-0" /> {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const ScanDetail = () => {
  const { scanId } = useParams();
  const [scan, setScan] = useState(null);
  const [diffData, setDiffData] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
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

    const fetchDiff = async () => {
      try {
        const response = await api.get(`/scans/${scanId}/diff`);
        if (response.data.has_previous) {
          setDiffData(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch scan diff');
      }
    };

    fetchScan();
    fetchDiff();
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
        <div className="flex items-center space-x-4">
          {diffData && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`flex items-center px-4 py-2 rounded-lg font-bold transition ${
                showDiff ? 'bg-orange-600 text-white' : 'bg-gray-800 text-orange-400 border border-orange-900/50 hover:bg-gray-700'
              }`}
            >
              <Diff size={18} className="mr-2" />
              {showDiff ? 'Hide Changes' : 'View Changes'}
            </button>
          )}
          <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-full border border-green-800 font-bold">
            Success
          </div>
        </div>
      </div>

      {showDiff && diffData && (
        <div className="mb-8 bg-gray-800 border-2 border-orange-900/50 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-orange-900/20 px-6 py-4 border-b border-orange-900/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-orange-400 flex items-center">
                <AlertCircle className="mr-2" /> Forensic Changes Detected
              </h2>
              <p className="text-orange-900/80 text-sm italic">Comparing with scan from {new Date(diffData.previous_timestamp).toLocaleString()}</p>
            </div>
            <button onClick={() => setShowDiff(false)} className="text-gray-500 hover:text-white"><ChevronUp /></button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
             <DiffSection title="Packages" fieldDiff={diffData.diff.packages} />
             <DiffSection title="Services" fieldDiff={diffData.diff.verified_services} />
             <DiffSection title="Ports" fieldDiff={diffData.diff.listening_ports} />
             <DiffSection title="Docker" fieldDiff={diffData.diff.docker} />
             <DiffSection title="Firewall" fieldDiff={diffData.diff.firewall_rules} />
             {diffData.diff.ssh_keys && (
               <div className="mb-4">
                 <h4 className="text-sm font-bold text-gray-300 mb-2 uppercase">SSH Keys</h4>
                 <div className="space-y-1 text-xs">
                   {diffData.diff.ssh_keys.added.map(u => <div className="text-green-400 bg-green-900/20 p-1 rounded">Added: {u}</div>)}
                   {diffData.diff.ssh_keys.removed.map(u => <div className="text-red-400 bg-red-900/20 p-1 rounded">Removed: {u}</div>)}
                   {diffData.diff.ssh_keys.changed.map(u => <div className="text-yellow-400 bg-yellow-900/20 p-1 rounded">Changed: {u}</div>)}
                 </div>
               </div>
             )}
          </div>
          {Object.keys(diffData.diff).length === 0 && (
            <div className="p-12 text-center text-gray-500 italic">No significant changes detected between these scans.</div>
          )}
        </div>
      )}

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
