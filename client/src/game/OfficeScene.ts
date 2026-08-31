import Phaser from 'phaser';

export interface AgentData {
  id: string;
  name: string;
  role: string;
  desk_x: number;
  desk_y: number;
  status: 'idle' | 'walking' | 'typing' | 'error';
}

export class OfficeScene extends Phaser.Scene {
  private tileSize = 48;
  private agentSprites: Map<string, { container: Phaser.GameObjects.Container; textBubble?: Phaser.GameObjects.Text }> = new Map();
  private onAgentClickCallback?: (agentId: string) => void;

  constructor() {
    super('OfficeScene');
  }

  public setOnAgentClick(cb: (agentId: string) => void) {
    this.onAgentClickCallback = cb;
  }

  create() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x334155, 0.4);

    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 10; y++) {
        graphics.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      }
    }
  }

  public syncAgents(agents: AgentData[]) {
    agents.forEach((agent) => {
      if (!this.agentSprites.has(agent.id)) {
        this.createAgentNode(agent);
      } else {
        this.updateAgentVisuals(agent);
      }
    });
  }

  private createAgentNode(agent: AgentData) {
    const worldX = agent.desk_x * this.tileSize + this.tileSize / 2;
    const worldY = agent.desk_y * this.tileSize + this.tileSize / 2;

    const container = this.add.container(worldX, worldY);

    const desk = this.add.rectangle(0, 0, 42, 34, 0x475569);
    desk.setStrokeStyle(2, 0x1e293b);

    const monitor = this.add.rectangle(0, -6, 20, 10, 0x0ea5e9);

    const avatar = this.add.circle(0, 10, 12, agent.role.includes('Lead') ? 0xf59e0b : 0x10b981);
    avatar.setStrokeStyle(2, 0xffffff);

    const nameTag = this.add.text(0, 26, agent.name.split(' ')[0], {
      fontSize: '10px',
      color: '#cbd5e1',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    container.add([desk, monitor, avatar, nameTag]);
    container.setSize(48, 48);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      if (this.onAgentClickCallback) this.onAgentClickCallback(agent.id);
    });

    this.agentSprites.set(agent.id, { container });
  }

  public updateAgentVisuals(agent: AgentData) {
    const entry = this.agentSprites.get(agent.id);
    if (!entry) return;

    if (agent.status === 'typing') {
      this.tweens.add({
        targets: entry.container,
        scale: 1.08,
        duration: 200,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.tweens.killTweensOf(entry.container);
      entry.container.setScale(1);
    }
  }

  public streamBubble(agentId: string, textSnippet: string) {
    const entry = this.agentSprites.get(agentId);
    if (!entry) return;

    if (entry.textBubble) {
      entry.textBubble.destroy();
    }

    const bubble = this.add.text(0, -28, textSnippet.slice(-30), {
      fontSize: '9px',
      color: '#ffffff',
      backgroundColor: '#0f172a',
      padding: { x: 4, y: 2 },
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    entry.container.add(bubble);
    entry.textBubble = bubble;

    this.time.delayedCall(4000, () => {
      bubble.destroy();
    });
  }
}
