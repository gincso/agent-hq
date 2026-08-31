import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { OfficeScene, AgentData } from '../game/OfficeScene';

interface OfficeCanvasProps {
  agents: AgentData[];
  onSelectAgent: (agentId: string) => void;
  streamPayload: { agentId: string; chunk: string } | null;
}

export const OfficeCanvas: React.FC<OfficeCanvasProps> = ({ agents, onSelectAgent, streamPayload }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OfficeScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new OfficeScene();
    sceneRef.current = scene;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 768,
      height: 480,
      backgroundColor: '#0f172a',
      scene: [scene],
    };

    const game = new Phaser.Game(config);
    scene.setOnAgentClick(onSelectAgent);

    return () => {
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.syncAgents(agents);
    }
  }, [agents]);

  useEffect(() => {
    if (sceneRef.current && streamPayload) {
      sceneRef.current.streamBubble(streamPayload.agentId, streamPayload.chunk);
    }
  }, [streamPayload]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900 flex justify-center">
      <div ref={containerRef} />
    </div>
  );
};
