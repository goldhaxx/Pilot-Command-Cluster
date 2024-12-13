import React, { useEffect, useRef, useState } from 'react';
import { Installation, Link, Route } from '../types/PlanetaryIndustry';

interface Props {
  installations: Installation[];
  links: Link[];
  routes: Route[];
  width: number;
  height: number;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  type: string;
  installation: Installation;
}

const NetworkVisualization: React.FC<Props> = ({ installations, links, routes, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<NodePosition | null>(null);

  const getShortLabel = (typeName: string, type: string): string => {
    switch (type) {
      case 'extractor':
        return 'Extractor';
      case 'processor':
        return 'Basic Industry';
      case 'storage':
        return 'Storage';
      case 'factory':
        return 'Advanced Industry';
      case 'spaceport':
        return 'Launchpad';
      case 'command_center':
        return 'Command Center';
      default:
        return typeName.split(' ')[0];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create node type groups
    const extractors = installations.filter(i => i.type === 'extractor');
    const processors = installations.filter(i => i.type === 'processor');
    const storage = installations.filter(i => i.type === 'storage');
    const factories = installations.filter(i => i.type === 'factory');
    const spaceports = installations.filter(i => i.type === 'spaceport');
    const commandCenters = installations.filter(i => i.type === 'command_center');

    // Calculate positions
    const positions: NodePosition[] = [];
    const margin = 80;
    const nodeSpacing = 120;
    const columnWidth = Math.min(width - (margin * 2), nodeSpacing * 3);
    const xOffset = (width - columnWidth) / 2;

    // Position extractors at top
    extractors.forEach((node, i) => {
      positions.push({
        id: node.id,
        x: xOffset + margin + (i * nodeSpacing),
        y: margin,
        type: node.type,
        installation: node
      });
    });

    // Position processors below extractors
    processors.forEach((node, i) => {
      positions.push({
        id: node.id,
        x: xOffset + margin + (i * nodeSpacing),
        y: margin + nodeSpacing,
        type: node.type,
        installation: node
      });
    });

    // Position storage in middle
    storage.forEach((node, i) => {
      positions.push({
        id: node.id,
        x: xOffset + margin + (i * nodeSpacing),
        y: margin + (nodeSpacing * 2),
        type: node.type,
        installation: node
      });
    });

    // Position factories below storage
    factories.forEach((node, i) => {
      positions.push({
        id: node.id,
        x: xOffset + margin + (i * nodeSpacing),
        y: margin + (nodeSpacing * 3),
        type: node.type,
        installation: node
      });
    });

    // Position spaceports at bottom
    spaceports.forEach((node, i) => {
      positions.push({
        id: node.id,
        x: xOffset + margin + (i * nodeSpacing),
        y: margin + (nodeSpacing * 4),
        type: node.type,
        installation: node
      });
    });

    // Position command centers to the right of storage
    commandCenters.forEach((node) => {
      positions.push({
        id: node.id,
        x: xOffset + margin + (columnWidth - nodeSpacing),
        y: margin + (nodeSpacing * 2),
        type: node.type,
        installation: node
      });
    });

    // Draw links first (background)
    ctx.strokeStyle = 'rgba(0, 136, 255, 0.6)';
    ctx.lineWidth = 2;

    links.forEach(link => {
      const sourcePos = positions.find(p => p.id === link.source_id);
      const destPos = positions.find(p => p.id === link.dest_id);

      if (sourcePos && destPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(destPos.x, destPos.y);
        ctx.stroke();
      }
    });

    // Draw routes (background)
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)';
    ctx.lineWidth = 2;

    routes.forEach(route => {
      const sourcePos = positions.find(p => p.id === route.source_id);
      const destPos = positions.find(p => p.id === route.dest_id);

      if (sourcePos && destPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(destPos.x, destPos.y);
        ctx.stroke();
      }
    });

    // Draw nodes and labels
    positions.forEach(pos => {
      // Draw node
      ctx.beginPath();
      ctx.fillStyle = getNodeColor(pos.type);
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();

      // Draw label background
      const label = getShortLabel(pos.installation.type_name, pos.type);
      ctx.font = '12px Arial';
      const metrics = ctx.measureText(label);
      const labelWidth = metrics.width + 10;
      const labelHeight = 20;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        pos.x - labelWidth / 2,
        pos.y + 15,
        labelWidth,
        labelHeight
      );

      // Draw label text
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pos.x, pos.y + 25);
    });

    // Add mouse move handler for tooltips
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hoveredNode = positions.find(pos => {
        const dx = pos.x - x;
        const dy = pos.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 15;
      });

      setHoveredNode(hoveredNode || null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);

  }, [installations, links, routes, width, height]);

  const getNodeColor = (type: string): string => {
    switch (type) {
      case 'extractor':
        return '#4CAF50';
      case 'processor':
        return '#2196F3';
      case 'storage':
        return '#FFC107';
      case 'factory':
        return '#9C27B0';
      case 'spaceport':
        return '#FF5722';
      case 'command_center':
        return '#607D8B';
      default:
        return '#999999';
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #333',
          background: '#1a1a1a'
        }}
      />
      {hoveredNode && (
        <div
          className="absolute z-10 p-2 bg-gray-800 text-white text-sm rounded shadow-lg"
          style={{
            left: hoveredNode.x + 20,
            top: hoveredNode.y - 10,
            maxWidth: '200px'
          }}
        >
          <div className="font-bold">{hoveredNode.installation.type_name}</div>
          <div>Type: {hoveredNode.type}</div>
          <div>Status: {hoveredNode.installation.status}</div>
          <div>ID: {hoveredNode.installation.id}</div>
        </div>
      )}
    </div>
  );
};

export default NetworkVisualization; 