import React, { useEffect, useRef, useState } from 'react';
import { LeafMood } from '../../types';
import { useApp } from '../../context/AppContext';

interface LivingBackgroundProps {
  leafMood?: LeafMood;
  showNatureElements?: boolean;
}

interface LeafParticle {
  x: number;
  y: number;
  size: number;
  baseSpeedY: number;
  speedY: number;
  swaySpeed: number;
  swayAmplitude: number;
  swayOffset: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
  isBlurred: boolean;
}

export const LivingBackground: React.FC<LivingBackgroundProps> = ({
  leafMood = 'calm',
  showNatureElements = true,
}) => {
  const { theme } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !showNatureElements) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isTabVisible = !document.hidden;

    const isMobile = window.innerWidth < 768;
    const maxLeaves = isMobile ? 12 : 24;

    const colors = [
      '#A5C9BC', // Pale Sage
      '#34796E', // Eucalyptus Teal
      '#74A296', // Mid-sage blend
      '#BFDAD0', // Soft Pale Sage
    ];

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Initialize leaves
    const leaves: LeafParticle[] = [];
    for (let i = 0; i < maxLeaves; i++) {
      leaves.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 9 + Math.random() * 14,
        baseSpeedY: 0.5 + Math.random() * 0.9,
        speedY: 0.5 + Math.random() * 0.9,
        swaySpeed: 0.008 + Math.random() * 0.015,
        swayAmplitude: 0.8 + Math.random() * 1.5,
        swayOffset: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.22 + Math.random() * 0.42,
        isBlurred: Math.random() < 0.25,
      });
    }

    let time = 0;
    let gustStrength = 0;
    let gustTarget = 0;
    let gustCooldown = 200;

    const render = () => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time++;
      ctx.clearRect(0, 0, width, height);

      // Handle wind gusts
      gustCooldown--;
      if (gustCooldown <= 0) {
        // Trigger occasional breeze
        gustTarget = leafMood === 'windy' ? 2.4 : 1.2;
        gustCooldown = leafMood === 'windy' ? 120 + Math.random() * 150 : 360 + Math.random() * 400;
      }

      // Smoothly approach gust target
      gustStrength += (gustTarget - gustStrength) * 0.03;
      if (Math.abs(gustStrength - gustTarget) < 0.05 && gustTarget > 0) {
        gustTarget = 0; // Gust fades out
      }

      // Render each leaf
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];

        // Lateral sway and drift
        const moodMultiplier = leafMood === 'windy' ? 2.0 : 1.0;
        const sway = Math.sin(time * leaf.swaySpeed + leaf.swayOffset) * leaf.swayAmplitude;
        const windDrift = (0.35 + gustStrength * 1.4) * moodMultiplier;

        leaf.x += sway + windDrift;
        leaf.y += leaf.speedY * (1 + gustStrength * 0.45) * (leafMood === 'windy' ? 1.5 : 1);
        leaf.rotation += leaf.rotationSpeed + gustStrength * 0.01;

        // Reset if drifted beyond bounds
        if (leaf.y > height + 40) {
          leaf.y = -30;
          leaf.x = Math.random() * (width + 100) - 50;
        }
        if (leaf.x > width + 40) {
          leaf.x = -30;
        }

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);
        ctx.globalAlpha = leaf.opacity;

        if (leaf.isBlurred) {
          ctx.filter = 'blur(2px)';
        }

        // Draw leaf silhouette (natural pointed oval with stem vein)
        ctx.fillStyle = leaf.color;
        ctx.beginPath();
        const l = leaf.size;
        const w = leaf.size * 0.52;

        ctx.moveTo(0, -l);
        ctx.bezierCurveTo(w, -l * 0.5, w * 1.1, l * 0.4, 0, l);
        ctx.bezierCurveTo(-w * 1.1, l * 0.4, -w, -l * 0.5, 0, -l);
        ctx.fill();

        // Central vein
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(0, -l * 0.75);
        ctx.lineTo(0, l * 0.75);
        ctx.stroke();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [leafMood, prefersReducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Dark Theme: Atmospheric Midnight Gradient Layer */}
      {theme === 'dark' ? (
        <div className="absolute inset-0 sylva-midnight-bg transition-opacity duration-300" />
      ) : (
        <>
          {/* Light Theme: Base Eucalyptus Haze Gradient */}
          <div
            className="absolute inset-0 transition-colors duration-300"
            style={{
              background: 'linear-gradient(175deg, var(--bg-app) 0%, var(--bg-secondary) 100%)',
            }}
          />

      {/* 2. Slow-drifting Botanical Glows (startup page only) */}
      {!prefersReducedMotion && showNatureElements && (
        <>
          <div
            className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full opacity-30 blur-[80px]"
            style={{
              background: 'radial-gradient(circle, var(--surface-highlight) 0%, transparent 70%)',
              animation: 'sylva-drift-glow 24s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute top-[40%] -right-[15%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full opacity-25 blur-[90px]"
            style={{
              background: 'radial-gradient(circle, var(--primary-accent) 0%, transparent 70%)',
              animation: 'sylva-drift-glow-reverse 28s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute -bottom-[10%] left-[20%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full opacity-20 blur-[80px]"
            style={{
              background: 'radial-gradient(circle, var(--surface-highlight) 0%, transparent 70%)',
              animation: 'sylva-drift-glow 32s ease-in-out infinite alternate-reverse',
            }}
          />
        </>
      )}

      {/* 3. Falling leaves canvas (startup page only) */}
      {!prefersReducedMotion && showNatureElements && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* 4. Roots and vines along screen edges: left edge, right edge, bottom corners (startup page only) */}
      {showNatureElements && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
        <defs>
          <style>{`
            @keyframes vineGrow {
              0% { stroke-dashoffset: 600; opacity: 0; }
              20% { opacity: 0.8; }
              100% { stroke-dashoffset: 0; opacity: 1; }
            }
            @keyframes leafPop {
              0% { transform: scale(0); opacity: 0; }
              70% { transform: scale(1.15); opacity: 0.9; }
              100% { transform: scale(1); opacity: 0.85; }
            }
            @keyframes vineSwayLeft {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(1deg) translateY(2px); }
            }
            @keyframes vineSwayRight {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-1.2deg) translateY(-2px); }
            }
            .vine-path {
              stroke-dasharray: 600;
              stroke-dashoffset: 600;
              animation: vineGrow 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            .vine-path-delay-1 {
              animation-delay: 0.3s;
            }
            .vine-path-delay-2 {
              animation-delay: 0.6s;
            }
            .vine-leaf {
              transform-origin: center;
              animation: leafPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .swaying-left {
              transform-origin: 0% 50%;
              animation: vineSwayLeft 10s ease-in-out infinite;
            }
            .swaying-right {
              transform-origin: 100% 50%;
              animation: vineSwayRight 12s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* Left Edge Vine System */}
        <g className={prefersReducedMotion ? '' : 'swaying-left'}>
          <path
            d="M -10,120 Q 35,240 15,380 T 32,540 Q 10,680 -10,800"
            fill="none"
            stroke="#34796E"
            strokeWidth="1.75"
            strokeLinecap="round"
            className={prefersReducedMotion ? '' : 'vine-path'}
          />
          <path
            d="M 22,290 C 45,280 55,300 62,310"
            fill="none"
            stroke="#34796E"
            strokeWidth="1.25"
            strokeLinecap="round"
            className={prefersReducedMotion ? '' : 'vine-path vine-path-delay-1'}
          />
          {/* Leaves along left stem */}
          <path
            d="M 62,310 C 72,305 78,315 72,324 C 65,330 58,322 62,310 Z"
            fill="#A5C9BC"
            className={prefersReducedMotion ? '' : 'vine-leaf'}
            style={{ animationDelay: '1.2s' }}
          />
          <path
            d="M 18,440 C 35,435 48,445 42,455 C 32,462 22,452 18,440 Z"
            fill="#74A296"
            className={prefersReducedMotion ? '' : 'vine-leaf'}
            style={{ animationDelay: '1.6s' }}
          />
          <path
            d="M 28,610 C 48,605 56,620 48,630 C 38,638 30,625 28,610 Z"
            fill="#A5C9BC"
            className={prefersReducedMotion ? '' : 'vine-leaf'}
            style={{ animationDelay: '2.0s' }}
          />
        </g>

        {/* Right Edge Vine System */}
        <g className={prefersReducedMotion ? '' : 'swaying-right'}>
          <path
            d="M 1450,160 Q 1405,280 1422,420 T 1408,600 Q 1435,720 1450,840"
            fill="none"
            stroke="#34796E"
            strokeWidth="1.75"
            strokeLinecap="round"
            className={prefersReducedMotion ? '' : 'vine-path vine-path-delay-1'}
          />
          <path
            d="M 1418,340 C 1392,345 1380,330 1374,318"
            fill="none"
            stroke="#34796E"
            strokeWidth="1.25"
            strokeLinecap="round"
            className={prefersReducedMotion ? '' : 'vine-path vine-path-delay-2'}
          />
          <path
            d="M 1374,318 C 1362,312 1358,322 1364,330 C 1372,336 1378,328 1374,318 Z"
            fill="#A5C9BC"
            className={prefersReducedMotion ? '' : 'vine-leaf'}
            style={{ animationDelay: '1.5s' }}
          />
          <path
            d="M 1412,490 C 1395,496 1384,484 1390,474 C 1398,468 1410,476 1412,490 Z"
            fill="#74A296"
            className={prefersReducedMotion ? '' : 'vine-leaf'}
            style={{ animationDelay: '1.9s' }}
          />
        </g>

        {/* Bottom Left Corner Vines */}
        <g>
          <path
            d="M -10,880 Q 90,870 140,895"
            fill="none"
            stroke="#34796E"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={prefersReducedMotion ? '' : 'vine-path vine-path-delay-2'}
          />
          <path
            d="M 100,875 C 112,860 125,865 120,878 C 114,886 102,884 100,875 Z"
            fill="#A5C9BC"
            className={prefersReducedMotion ? '' : 'vine-leaf'}
            style={{ animationDelay: '2.2s' }}
          />
        </g>

        {/* Bottom Right Corner Vines */}
        <g>
          <path
            d="M 1450,885 Q 1360,865 1300,895"
            fill="none"
            stroke="#34796E"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={prefersReducedMotion ? '' : 'vine-path vine-path-delay-2'}
          />
          <path
            d="M 1340,872 C 1326,860 1315,868 1320,880 C 1328,888 1338,882 1340,872 Z"
            fill="#74A296"
            className={prefersReducedMotion ? '' : 'vine-leaf'}
            style={{ animationDelay: '2.4s' }}
          />
        </g>
      </svg>
      )}
        </>
      )}
    </div>
  );
};
