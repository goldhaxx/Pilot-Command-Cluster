import React, { useEffect, useRef } from 'react';
import { Link, Route, Pin } from '../types/PlanetaryIndustry'

interface ConnectionsOverlayProps {
  links: Link[];
  routes: Route[];
  pins: Pin[];
}

const ConnectionsOverlay: React.FC<ConnectionsOverlayProps> = ({ links, routes, pins }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    // Get parent dimensions
    const parent = canvas.parentElement;
    if (!parent) {
      console.error('Parent not found');
      return;
    }

    // Set canvas dimensions
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    canvas.width = width;
    canvas.height = height;

    console.log('Canvas dimensions:', {
      parentWidth: width,
      parentHeight: height,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });

    // Get context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // Draw a simple red rectangle
    ctx.fillStyle = 'red';
    ctx.fillRect(50, 50, 100, 100);

    // Log props to show they're being used
    console.log('Props:', { links, routes, pins });

  }, [links, routes, pins]); // Add dependencies

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '400px',
      border: '2px solid red',
      backgroundColor: 'black'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: '2px solid yellow'
        }}
      />
    </div>
  );
};

export default ConnectionsOverlay; 