import { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface Hexagon {
  x: number;
  y: number;
  opacity: number;
}

export function CursorEffect() {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const hexagonsRef = useRef<Hexagon[]>([]);
  const requestRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initHexagons();
    };

    const initHexagons = () => {
      const hexSize = 15; // Size of hexagon
      const hexWidth = Math.sqrt(3) * hexSize;
      const hexHeight = 2 * hexSize;
      const xSpacing = hexWidth;
      const ySpacing = 0.75 * hexHeight; // Vertical distance between rows
      
      const cols = Math.ceil(canvas.width / xSpacing) + 2;
      const rows = Math.ceil(canvas.height / ySpacing) + 2;
      
      const newHexagons: Hexagon[] = [];
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const xOffset = (row % 2) * (hexWidth / 2);
          const x = col * xSpacing + xOffset;
          const y = row * ySpacing;
          
          newHexagons.push({
            x,
            y,
            opacity: 0
          });
        }
      }
      hexagonsRef.current = newHexagons;
    };

    const drawHexagon = (x: number, y: number, size: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6; // Rotate 30deg to point up
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const radius = 120;

      hexagonsRef.current.forEach(hex => {
        const dx = hex.x - mouseX;
        const dy = hex.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const targetOpacity = 1 - (dist / radius);
          hex.opacity += (targetOpacity - hex.opacity) * 0.35;
        } else {
          hex.opacity *= 0.9;
        }

        if (hex.opacity > 0.01) {
          const normalizedX = hex.x / canvas.width;
          const r = Math.round(59 + (20 - 59) * normalizedX);
          const g = Math.round(130 + (184 - 130) * normalizedX);
          const b = Math.round(246 + (166 - 246) * normalizedX);
          
          const alpha = hex.opacity * 0.4; // Reduced max opacity
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${hex.opacity * 0.6})`;
          ctx.lineWidth = 1;
          
          drawHexagon(hex.x, hex.y, 14); 
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isDark]);

  return (
    <canvas 
      ref={canvasRef}
      // Changed z-index to 0 to sit behind content (which is now z-10)
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
