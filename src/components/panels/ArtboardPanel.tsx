import React from 'react';
import { Maximize2, Monitor } from 'lucide-react';
import type { Editor } from '../../core/Editor';
import type { ArtboardConfig } from '../../core/types';

interface ArtboardPanelProps {
  editor: Editor | null;
  artboard: ArtboardConfig;
  onUpdateArtboard: (config: Partial<ArtboardConfig>) => void;
}

const PRESETS = [
  { label: 'Web Standard (1200 × 800)', width: 1200, height: 800 },
  { label: 'Full HD (1920 × 1080)', width: 1920, height: 1080 },
  { label: 'HD 720p (1280 × 720)', width: 1280, height: 720 },
  { label: 'Квадрат (800 × 800)', width: 800, height: 800 },
  { label: 'Иконка (512 × 512)', width: 512, height: 512 },
];

export const ArtboardPanel: React.FC<ArtboardPanelProps> = ({
  editor,
  artboard,
  onUpdateArtboard,
}) => {
  if (!editor) return null;

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ai-textMuted uppercase tracking-wider flex items-center gap-1.5">
          <Monitor size={13} />
          Монтажная область (Artboard)
        </span>
        <button
          onClick={() => editor.viewport.fitArtboard()}
          className="text-ai-accent hover:text-ai-accentHover p-1 rounded hover:bg-ai-darker flex items-center gap-1 text-[11px]"
          title="Вписать артборд в экран [Ctrl+0]"
        >
          <Maximize2 size={12} />
          Вписать
        </button>
      </div>

      <div className="bg-ai-darker p-2.5 rounded border border-ai-border flex flex-col gap-2.5">
        {/* Presets dropdown */}
        <div>
          <label className="text-[10px] text-ai-textMuted block mb-1">Шаблоны размеров:</label>
          <select
            value=""
            onChange={(e) => {
              const preset = PRESETS.find((p) => `${p.width}x${p.height}` === e.target.value);
              if (preset) {
                onUpdateArtboard({ width: preset.width, height: preset.height });
              }
            }}
            className="w-full bg-ai-darkest text-ai-textLight border border-ai-border text-xs rounded px-2 py-1 outline-none focus:border-ai-accent"
          >
            <option value="" disabled>
              Выберите пресет...
            </option>
            {PRESETS.map((p) => (
              <option key={`${p.width}x${p.height}`} value={`${p.width}x${p.height}`}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Width and Height */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-ai-textMuted block mb-1">Ширина (W):</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="100"
                max="8000"
                value={artboard.width}
                onChange={(e) =>
                  onUpdateArtboard({ width: Math.max(100, parseInt(e.target.value) || 100) })
                }
                className="w-full bg-ai-darkest px-2 py-1 rounded border border-ai-border text-ai-textLight font-mono focus:border-ai-accent outline-none"
              />
              <span className="text-[10px] text-ai-textMuted">px</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-ai-textMuted block mb-1">Высота (H):</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="100"
                max="8000"
                value={artboard.height}
                onChange={(e) =>
                  onUpdateArtboard({ height: Math.max(100, parseInt(e.target.value) || 100) })
                }
                className="w-full bg-ai-darkest px-2 py-1 rounded border border-ai-border text-ai-textLight font-mono focus:border-ai-accent outline-none"
              />
              <span className="text-[10px] text-ai-textMuted">px</span>
            </div>
          </div>
        </div>

        {/* Background Color */}
        <div className="flex items-center justify-between pt-1 border-t border-ai-border/50">
          <span className="text-ai-textLight font-medium">Цвет фона:</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={artboard.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdateArtboard({ backgroundColor: e.target.value })}
              className="w-6 h-6 rounded border border-ai-border cursor-pointer bg-transparent"
            />
            <span className="font-mono text-ai-textMuted text-[11px]">
              {artboard.backgroundColor}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
