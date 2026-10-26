import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, Layers, Crosshair, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { FoliarAnalysis, PathologyLesionZone } from '../../types';
import { BOUNCY_SPRING } from '../../theme';

interface PathologyHeatmapCanvasProps {
  imageUrl: string;
  cropName: string;
  conditionName: string;
  foliarAnalysis: FoliarAnalysis;
}

export type ViewMode = 'heatmap' | 'contours' | 'photo';

export const PathologyHeatmapCanvas: React.FC<PathologyHeatmapCanvasProps> = ({
  imageUrl,
  cropName,
  conditionName,
  foliarAnalysis,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75);
  const [hoveredZone, setHoveredZone] = useState<PathologyLesionZone | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Handle mouse move for interactive lesion probing HUD
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePos({ x, y });

    // Check if within any lesion cluster radius
    const closest = foliarAnalysis.lesionClusters.find((zone) => {
      const dx = zone.xPct - x;
      const dy = zone.yPct - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= zone.radiusPct * 1.35;
    });

    setHoveredZone(closest || null);
  };

  const handleMouseLeave = () => {
    setHoveredZone(null);
    setMousePos(null);
  };

  return (
    <div className="sylva-card p-4 sm:p-5 space-y-4">
      {/* Top Controls: Mode Tabs & Opacity */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--glass-border-subtle)]">
        {/* View Mode Segmented Controls */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-glass-elevated)] border border-[var(--glass-border)] shadow-2xs">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewMode === 'heatmap'
                ? 'bg-[var(--primary-accent)] text-[var(--text-on-accent)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Pathology Heatmap</span>
          </button>

          <button
            onClick={() => setViewMode('contours')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewMode === 'contours'
                ? 'bg-[var(--primary-accent)] text-[var(--text-on-accent)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lesion Contours</span>
          </button>

          <button
            onClick={() => setViewMode('photo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              viewMode === 'photo'
                ? 'bg-[var(--primary-accent)] text-[var(--text-on-accent)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Natural Photo</span>
          </button>
        </div>

        {/* Heatmap Opacity Slider (when heatmap or contours enabled) */}
        {viewMode !== 'photo' && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
            <span>Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              className="w-20 accent-[var(--primary-accent)] cursor-pointer"
              title="Adjust overlay intensity"
              aria-label="Heatmap overlay opacity"
            />
            <span className="tabular-nums font-mono w-8 text-right">
              {Math.round(overlayOpacity * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Interactive Visual Canvas Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-[var(--surface-glass)] cursor-crosshair select-none shadow-inner"
      >
        {/* Base Leaf Photography */}
        <img
          src={imageUrl}
          alt={`Foliage photo of ${cropName}`}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Pathology SVG Heatmap & Lesion Contours Overlay */}
        {viewMode !== 'photo' && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200"
            style={{ opacity: overlayOpacity }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Radial gradient per lesion zone representing necrotic core and chlorotic halo */}
              {foliarAnalysis.lesionClusters.map((zone) => (
                <radialGradient
                  key={`grad-${zone.id}`}
                  id={`grad-${zone.id}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop offset="0%" stopColor="#DC2626" stopOpacity={0.92 * zone.intensity} />
                  <stop offset="35%" stopColor="#EA580C" stopOpacity={0.78 * zone.intensity} />
                  <stop offset="65%" stopColor="#EAB308" stopOpacity={0.55 * zone.intensity} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </radialGradient>
              ))}

              {/* Contour pattern filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Heatmap Density Mode */}
            {viewMode === 'heatmap' &&
              foliarAnalysis.lesionClusters.map((zone) => (
                <circle
                  key={`heat-${zone.id}`}
                  cx={zone.xPct}
                  cy={zone.yPct}
                  r={zone.radiusPct}
                  fill={`url(#grad-${zone.id})`}
                  className="transition-all duration-300"
                />
              ))}

            {/* Contour Vector Outlines Mode */}
            {viewMode === 'contours' &&
              foliarAnalysis.lesionClusters.map((zone) => (
                <g key={`contour-${zone.id}`} className="transition-all duration-300">
                  {/* Outer chlorotic halo boundary */}
                  <circle
                    cx={zone.xPct}
                    cy={zone.yPct}
                    r={zone.radiusPct}
                    fill="rgba(234, 179, 8, 0.16)"
                    stroke="#EAB308"
                    strokeWidth="0.75"
                    strokeDasharray="1.5,1.5"
                  />
                  {/* Inner necrotic core boundary */}
                  <circle
                    cx={zone.xPct}
                    cy={zone.yPct}
                    r={zone.radiusPct * 0.48}
                    fill="rgba(220, 38, 38, 0.35)"
                    stroke="#DC2626"
                    strokeWidth="1.1"
                    filter="url(#glow)"
                  />
                  {/* Center lesion marker */}
                  <circle
                    cx={zone.xPct}
                    cy={zone.yPct}
                    r="0.8"
                    fill="#FFFFFF"
                  />
                </g>
              ))}

            {/* Active Hover Reticle Highlight */}
            {hoveredZone && (
              <g className="animate-pulse">
                <circle
                  cx={hoveredZone.xPct}
                  cy={hoveredZone.yPct}
                  r={hoveredZone.radiusPct + 2}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={hoveredZone.xPct}
                  cy={hoveredZone.yPct}
                  r="1.2"
                  fill="#FFFFFF"
                />
              </g>
            )}
          </svg>
        )}

        {/* Live Hover Probe Tooltip HUD */}
        {hoveredZone && mousePos && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl backdrop-blur-md bg-black/85 text-white border border-white/20 shadow-xl max-w-xs space-y-1 transition-all"
            style={{
              left: `${Math.min(85, Math.max(15, hoveredZone.xPct))}%`,
              top: `${Math.max(18, hoveredZone.yPct - 6)}%`,
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              <Crosshair className="w-3 h-3" />
              <span>{hoveredZone.zoneName}</span>
              <span>·</span>
              <span className="capitalize">{hoveredZone.severity} Infection</span>
            </div>
            <div className="text-xs font-semibold leading-tight text-white">
              {hoveredZone.description}
            </div>
            <div className="text-[10px] text-slate-300 font-mono tabular-nums flex items-center justify-between pt-0.5 border-t border-white/15">
              <span>Pathogen density: {Math.round(hoveredZone.intensity * 100)}%</span>
              <span>Radius: {hoveredZone.radiusPct}px</span>
            </div>
          </div>
        )}

        {/* Corner HUD overlay badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg backdrop-blur-md bg-black/60 text-white border border-white/15 text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Spatial Lesion Analyzer</span>
          </span>
        </div>

        <div className="absolute bottom-3 right-3 pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg backdrop-blur-md bg-black/60 text-white/90 border border-white/15 text-[10px] font-mono">
            Hover leaf to inspect lesion clusters
          </span>
        </div>
      </div>

      {/* Foliar Damage Index Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Metric 1: Total Foliar Damage */}
        <div className="p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">
            Total Foliar Damage
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold tabular-nums text-[var(--text-primary)]">
              {foliarAnalysis.damagePercentage.toFixed(1)}%
            </span>
            <span className="text-[10px] font-semibold text-[var(--status-poor)]">
              Surface Necrosis
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-[var(--glass-border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, foliarAnalysis.damagePercentage)}%`,
                backgroundColor:
                  foliarAnalysis.damagePercentage > 35
                    ? 'var(--status-poor)'
                    : foliarAnalysis.damagePercentage > 18
                    ? 'var(--status-marginal)'
                    : 'var(--status-good)',
              }}
            />
          </div>
        </div>

        {/* Metric 2: Necrotic vs Chlorotic Breakdown */}
        <div className="p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">
            Tissue Degradation
          </div>
          <div className="flex items-center justify-between text-xs font-semibold pt-0.5">
            <span className="text-rose-500">Necrosis: {foliarAnalysis.necrosisPercentage}%</span>
            <span className="text-amber-500">Halo: {foliarAnalysis.chlorosisPercentage}%</span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] font-medium">
            {foliarAnalysis.lesionClusters.length} distinct spore clusters
          </div>
        </div>

        {/* Metric 3: Sporulation Threat */}
        <div className="p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">
            Sporulation Risk
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <AlertTriangle
              className={`w-4 h-4 ${
                foliarAnalysis.sporulationRisk === 'high'
                  ? 'text-[var(--status-poor)]'
                  : 'text-[var(--status-marginal)]'
              }`}
            />
            <span className="text-sm font-bold uppercase tracking-wide text-[var(--text-primary)]">
              {foliarAnalysis.sporulationRisk} Threat
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Active under morning dew
          </div>
        </div>

        {/* Metric 4: Photosynthetic Margin */}
        <div className="p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-glass-elevated)] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">
            Remaining Canopy
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <ShieldCheck className="w-4 h-4 text-[var(--status-good)]" />
            <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
              {foliarAnalysis.healthyPercentage.toFixed(1)}% Healthy
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Viable leaf tissue
          </div>
        </div>
      </div>
    </div>
  );
};
