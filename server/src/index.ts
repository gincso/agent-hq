import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { Orchestrator } from './llm.js';

dotenv.config();

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const orchestrator = new Orchestrator();

function broadcast(type: string, payload: any) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.get('/api/agents', (req, res) => {
  res.json(orchestrator.getAgents());
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'INIT_STATE', payload: { agents: orchestrator.getAgents() } }));

  ws.on('message', async (data: string) => {
    try {
      const { type, payload } = JSON.parse(data);

      if (type === 'ASSIGN_TASK') {
        const { agentId, prompt } = payload;
        
        broadcast('AGENT_STATUS', { agentId, status: 'walking' });
        
        setTimeout(async () => {
          broadcast('AGENT_STATUS', { agentId, status: 'typing' });

          try {
            await orchestrator.runAgentTask(agentId, prompt, (chunk) => {
              broadcast('AGENT_STREAM_CHUNK', { agentId, chunk });
            });
            broadcast('AGENT_STATUS', { agentId, status: 'idle' });
          } catch (err: any) {
            broadcast('AGENT_STATUS', { agentId, status: 'idle' });
            broadcast('AGENT_ERROR', { agentId, error: err.message });
          }
        }, 1200);
      }
    } catch (err) {
      console.error('Invalid WebSocket message format:', err);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Agent HQ server live on port ${PORT}`);
});
