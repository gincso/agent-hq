import OpenAI from 'openai';
import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export interface Agent {
  id: string;
  name: string;
  role: string;
  system_prompt: string;
  model: string;
  desk_x: number;
  desk_y: number;
  status: string;
}

export class Orchestrator {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key',
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/agent-hq',
        'X-Title': 'Agent HQ Self-Host',
      }
    });
  }

  public getAgents(): Agent[] {
    return db.prepare('SELECT * FROM agents').all() as Agent[];
  }

  public updateAgentStatus(agentId: string, status: string) {
    db.prepare('UPDATE agents SET status = ? WHERE id = ?').run(status, agentId);
  }

  public async runAgentTask(
    agentId: string,
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as Agent;
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    const history = db
      .prepare('SELECT role, content FROM messages WHERE agent_id = ? ORDER BY timestamp ASC LIMIT 10')
      .all(agentId) as { role: 'system' | 'user' | 'assistant'; content: string }[];

    const messages = [
      { role: 'system' as const, content: agent.system_prompt },
      ...history,
      { role: 'user' as const, content: prompt }
    ];

    db.prepare('INSERT INTO messages (id, agent_id, role, content) VALUES (?, ?, ?, ?)').run(
      uuidv4(),
      agentId,
      'user',
      prompt
    );

    this.updateAgentStatus(agentId, 'typing');
    let fullReply = '';

    try {
      const stream = await this.client.chat.completions.create({
        model: agent.model,
        messages: messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content || '';
        if (text) {
          fullReply += text;
          onChunk(text);
        }
      }

      db.prepare('INSERT INTO messages (id, agent_id, role, content) VALUES (?, ?, ?, ?)').run(
        uuidv4(),
        agentId,
        'assistant',
        fullReply
      );

      this.updateAgentStatus(agentId, 'idle');
      return fullReply;
    } catch (err) {
      this.updateAgentStatus(agentId, 'error');
      throw err;
    }
  }
}
