'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  connections: string[];
  size: number;
  brightness: number;
}

const nodes: Node[] = [
  {
    id: 'sleep',
    name: 'Sleep',
    x: 150,
    y: 100,
    connections: ['energy', 'mood'],
    size: 4,
    brightness: 0.9
  },
  {
    id: 'stress',
    name: 'Stress',
    x: 300,
    y: 80,
    connections: ['sleep', 'headaches'],
    size: 3,
    brightness: 0.7
  },
  {
    id: 'energy',
    name: 'Energy',
    x: 250,
    y: 200,
    connections: ['mood', 'productivity'],
    size: 3.5,
    brightness: 0.8
  },
  {
    id: 'mood',
    name: 'Mood',
    x: 100,
    y: 250,
    connections: ['sleep'],
    size: 3,
    brightness: 0.75
  },
  {
    id: 'headaches',
    name: 'Headaches',
    x: 400,
    y: 120,
    connections: ['stress'],
    size: 2.5,
    brightness: 0.6
  },
  {
    id: 'productivity',
    name: 'Focus',
    x: 350,
    y: 250,
    connections: ['energy'],
    size: 2.5,
    brightness: 0.65
  }
];

export default function HealthConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 500;
    canvas.height = 350;
    
    let time = 0;
    
    const animate = () => {
      time += 0.005;
      
      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw constellation lines (very subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      
      nodes.forEach(node => {
        node.connections.forEach(targetId => {
          const target = nodes.find(n => n.id === targetId);
          if (target) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        });
      });
      
      // Draw stars (nodes)
      nodes.forEach(node => {
        const isHovered = hoveredNode === node.id;
        const twinkle = Math.sin(time + node.x * 0.01) * 0.2 + 0.8;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 4);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${node.brightness * twinkle * (isHovered ? 0.5 : 0.2)})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Star core
        ctx.fillStyle = `rgba(255, 255, 255, ${node.brightness * twinkle})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw cross pattern for brighter stars
        if (node.brightness > 0.7) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${node.brightness * twinkle * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(node.x - node.size * 3, node.y);
          ctx.lineTo(node.x + node.size * 3, node.y);
          ctx.moveTo(node.x, node.y - node.size * 3);
          ctx.lineTo(node.x, node.y + node.size * 3);
          ctx.stroke();
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hoveredNode]);
  
  return (
    <div className="relative w-full h-[350px] rounded-2xl overflow-hidden">
      {/* Canvas for constellation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-70"
      />
      
      {/* Invisible hit areas for hover */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute cursor-pointer"
          style={{
            left: node.x - 20,
            top: node.y - 20,
            width: 40,
            height: 40
          }}
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Show label on hover */}
          {hoveredNode === node.id && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900/60 backdrop-blur-sm rounded px-2 py-1 text-xs text-white whitespace-nowrap"
            >
              {node.name}
            </motion.div>
          )}
        </div>
      ))}
      
      {/* Subtle legend */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-500">
        <p className="opacity-50">Your health constellation</p>
      </div>
    </div>
  );
}