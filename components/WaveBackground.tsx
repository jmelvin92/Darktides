import React, { useEffect, useRef } from 'react';

const WaveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let lines: any[] = [];
    const gap = 40;
    const waveHeight = 60;
    const speed = 0.002;
    let time = 0;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initLines();
    };

    const initLines = () => {
      lines = [];
      const totalLines = Math.ceil(height / gap);
      for (let i = 0; i < totalLines; i++) {
        lines.push({
          y: i * gap,
          amplitude: Math.random() * 20 + 10,
          frequency: Math.random() * 0.01 + 0.005,
          offset: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      
      // Deep ocean gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#050507');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      time += speed;

      lines.forEach((line, i) => {
        ctx.beginPath();
        
        // Fading opacity based on depth
        const opacity = Math.max(0.05, 1 - (line.y / height) - 0.2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${opacity * 0.3})`; // Cyan color

        for (let x = 0; x < width; x += 10) {
          // Sine wave math
          const y = line.y + Math.sin(x * line.frequency + time + line.offset) * (waveHeight * (x / width));
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    initLines();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
};

export default WaveBackground;