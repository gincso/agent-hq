import React, { useState, useEffect, useRef } from 'react';
import { OfficeCanvas } from './components/OfficeCanvas';
import { AgentData } from './game/OfficeScene';
import { Terminal, Send, Bot } from 'lucide-react';

export default function App() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_1');
  const [promptInput, setPromptInput] = useState('');
  const [streamData, setStreamData] = useState<{ agentId: string; chunk: string } | null>(null);
  const [terminalFeed, setTerminalFeed] = useState<string[]>([]);
  
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');
    ws.current = socket;

    socket.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);

      if (type === 'INIT_STATE') {
        setAgents(payload.agents);
      } else if (type === 'AGENT_STATUS') {
        setAgents((prev) =>
          prev.map((a) => (a.id === payload.agentId ? { ...a, status: payload.status } : a))
        );
      } else if (type === 'AGENT_STREAM_CHUNK') {
        setStreamData({ agentId: payload.agentId, chunk: payload.chunk });
        setTerminalFeed((prev) => [...prev.slice(-40), `[${payload.agentId}]: ${payload.chunk}`]);
      }
    };

    return () => socket.close();
  }, []);

  const handleSendTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || !ws.current) return;

    ws.current.send(
      JSON.stringify({
        type: 'ASSIGN_TASK',
        payload: { agentId: selectedAgentId, prompt: promptInput },
      })
    );

    setPromptInput('');
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-6 font-sans">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-sky-400">AGENT HQ // VIRTUAL OFFICE</h1>
          <p className="text-xs text-slate-400 font-mono">Autonomous Pixel Workspace</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <OfficeCanvas
            agents={agents}
            onSelectAgent={(id) => setSelectedAgentId(id)}
            streamPayload={streamData}
          />

          <form onSubmit={handleSendTask} className="flex gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 px-3 bg-slate-800 rounded text-xs font-mono text-slate-300">
              <Bot size={14} className="text-sky-400" />
              <span>{selectedAgent?.name || 'Select Agent'}</span>
            </div>
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={`Assign task to ${selectedAgent?.name || 'agent'}...`}
              className="flex-1 bg-slate-950 border border-slate-700 px-3 py-2 rounded text-sm focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded font-medium text-sm flex items-center gap-2"
            >
              <Send size={14} /> Dispatch
            </button>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[560px]">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-b border-slate-800 pb-2 mb-3">
            <Terminal size={14} className="text-emerald-400" />
            <span>LIVE AGENT STREAMS</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800">
            {terminalFeed.length === 0 ? (
              <span className="text-slate-600 italic">No activity yet. Click an agent and send a task...</span>
            ) : (
              terminalFeed.map((log, idx) => (
                <div key={idx} className="leading-relaxed break-words text-slate-300">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
