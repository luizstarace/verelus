'use client';

import { useState, useRef } from 'react';
import type { StageItem, StageItemType } from '@/lib/types/tools';
import { STAGE_ITEM_META } from '@/lib/types/tools';
import { StageItemIcon } from './StageItemIcon';

interface Props {
  items: StageItem[];
  onChange: (items: StageItem[]) => void;
}

const PALETTE: StageItemType[] = [
  'vocal_mic',
  'instrument_mic',
  'drum_kit',
  'guitar_amp',
  'bass_amp',
  'monitor',
  'di_box',
  'keyboard',
  'guitar_stand',
  'bass_stand',
  'acoustic_guitar',
  'power_outlet',
  'custom_label',
];

const STAGE_W = 600;
const STAGE_H = 320;
const ITEM_SIZE = 44; // visual size in editor

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function StagePlotEditor({ items, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  const addItem = (type: StageItemType) => {
    // Place item center by default, slight offset per additional to avoid stack
    const sameType = items.filter((i) => i.type === type).length;
    const offset = sameType * 0.04;
    const newItem: StageItem = {
      id: generateId(),
      type,
      x: 0.5 + offset,
      y: 0.5 + offset,
    };
    onChange([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingLabelId === id) setEditingLabelId(null);
  };

  const updateLabel = (id: string, label: string) => {
    onChange(items.map((i) => (i.id === id ? { ...i, label } : i)));
  };

  // Drag handlers
  const onPointerDown = (e: React.PointerEvent, item: StageItem) => {
    if (!svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const itemPixelX = item.x * STAGE_W;
    const itemPixelY = item.y * STAGE_H;
    const pointerX = e.clientX - svgRect.left;
    const pointerY = e.clientY - svgRect.top;
    setDragOffset({ dx: pointerX - itemPixelX, dy: pointerY - itemPixelY });
    setDraggingId(item.id);
    setSelectedId(item.id);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const pointerX = e.clientX - svgRect.left;
    const pointerY = e.clientY - svgRect.top;
    const rawX = pointerX - dragOffset.dx;
    const rawY = pointerY - dragOffset.dy;
    // Clamp to stage
    const x = Math.max(0, Math.min(1, rawX / STAGE_W));
    const y = Math.max(0, Math.min(1, rawY / STAGE_H));
    onChange(items.map((i) => (i.id === draggingId ? { ...i, x, y } : i)));
  };

  const onPointerUp = () => {
    setDraggingId(null);
  };

  return (
    <div className="space-y-3">
      {/* Palette */}
      <div>
        <p className="text-xs text-brand-muted mb-2">Clique em um equipamento pra adicionar ao palco:</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5">
          {PALETTE.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addItem(type)}
              className="flex flex-col items-center justify-center p-2 rounded-lg border border-white/10 bg-white/[0.02] hover:border-brand-green/40 hover:bg-brand-green/5 transition text-white/80 hover:text-white"
              title={STAGE_ITEM_META[type].label}
            >
              <div className="text-white/80">
                <StageItemIcon type={type} size={32} color="currentColor" />
              </div>
              <span className="text-[10px] mt-1 text-center leading-tight">{STAGE_ITEM_META[type].short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stage canvas */}
      <div className="relative bg-white/[0.02] border border-white/10 rounded-xl p-3">
        <p className="text-[10px] uppercase tracking-wider text-brand-muted font-mono mb-2 text-center">
          Fundo do palco
        </p>
        <svg
          ref={svgRef}
          width={STAGE_W}
          height={STAGE_H}
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          className="w-full h-auto bg-gradient-to-b from-white/[0.03] to-white/[0.08] rounded-lg cursor-default select-none touch-none"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Stage floor */}
          <rect x="0" y="0" width={STAGE_W} height={STAGE_H} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Grid guides */}
          {[0.25, 0.5, 0.75].map((pct) => (
            <g key={pct}>
              <line x1={STAGE_W * pct} y1={0} x2={STAGE_W * pct} y2={STAGE_H} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1={0} y1={STAGE_H * pct} x2={STAGE_W} y2={STAGE_H * pct} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </g>
          ))}

          {/* Items */}
          {items.map((item) => {
            const px = item.x * STAGE_W;
            const py = item.y * STAGE_H;
            const isSelected = selectedId === item.id;
            const isDragging = draggingId === item.id;
            const label = item.label ?? STAGE_ITEM_META[item.type].short;

            return (
              <g
                key={item.id}
                transform={`translate(${px - ITEM_SIZE / 2}, ${py - ITEM_SIZE / 2})`}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onPointerDown={(e) => onPointerDown(e, item)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
              >
                {isSelected && (
                  <rect
                    x={-3}
                    y={-3}
                    width={ITEM_SIZE + 6}
                    height={ITEM_SIZE + 18}
                    rx="8"
                    fill="rgba(0,245,160,0.08)"
                    stroke="#00f5a0"
                    strokeWidth="1"
                  />
                )}
                <foreignObject width={ITEM_SIZE} height={ITEM_SIZE}>
                  <div className="w-full h-full text-white">
                    <StageItemIcon type={item.type} size={ITEM_SIZE} color="currentColor" />
                  </div>
                </foreignObject>
                <text
                  x={ITEM_SIZE / 2}
                  y={ITEM_SIZE + 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill={isSelected ? '#00f5a0' : 'rgba(255,255,255,0.7)'}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* PUBLIC label on bottom */}
          <rect x="0" y={STAGE_H - 22} width={STAGE_W} height="22" fill="rgba(0,245,160,0.05)" />
          <text
            x={STAGE_W / 2}
            y={STAGE_H - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fontFamily="sans-serif"
            fill="rgba(0,245,160,0.8)"
            letterSpacing="2"
          >
            PUBLICO
          </text>
        </svg>

        {/* Hint */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-brand-muted">Clique num equipamento acima pra comecar</p>
          </div>
        )}
      </div>

      {/* Selected item controls */}
      {selectedId && (() => {
        const selected = items.find((i) => i.id === selectedId);
        if (!selected) return null;
        return (
          <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-brand-green">
                <StageItemIcon type={selected.type} size={32} color="currentColor" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-brand-muted uppercase tracking-wider font-mono">
                  {STAGE_ITEM_META[selected.type].label}
                </p>
                <p className="text-xs text-brand-muted">
                  Posicao: {Math.round(selected.x * 100)}%, {Math.round(selected.y * 100)}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeItem(selected.id)}
                className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"
              >
                Remover
              </button>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Rotulo (aparece no PDF)</label>
              {editingLabelId === selected.id ? (
                <input
                  type="text"
                  value={selected.label ?? ''}
                  placeholder={STAGE_ITEM_META[selected.type].short}
                  onChange={(e) => updateLabel(selected.id, e.target.value)}
                  onBlur={() => setEditingLabelId(null)}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-green/50"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingLabelId(selected.id)}
                  className="w-full text-left bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white hover:border-white/20"
                >
                  {selected.label || STAGE_ITEM_META[selected.type].short}
                  <span className="text-brand-muted ml-2">(clique pra editar)</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Itens atuais list */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`text-[11px] px-2 py-1 rounded-full border transition ${
                selectedId === item.id
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              {item.label || STAGE_ITEM_META[item.type].short}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] px-2 py-1 text-red-400 hover:text-red-300 ml-auto"
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  );
}
