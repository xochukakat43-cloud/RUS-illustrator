import React from 'react';
import { Maximize2, Monitor, Plus, Trash2, Layers } from 'lucide-react';
import type { Editor } from '../../core/Editor';
import type { ArtboardConfig } from '../../core/types';

interface ArtboardPanelProps {
  editor: Editor | null;
  artboard: ArtboardConfig;
  onUpdateArtboard: (config: Partial<ArtboardConfig>) => void;
}

const PRESETS = [
  { label: 'Full HD 1080p (1920 × 1080)', width: 1920, height: 1080 },
  { label: 'Web Standard (1200 × 800)', width: 1200, height: 800 },
  { label: 'Instagram Post (1080 × 1080)', width: 1080, height: 1080 },
  { label: 'Instagram Story (1080 × 1920)', width: 1080, height: 1920 },
  { label: 'Dribbble Shot (1600 × 1200)', width: 1600, height: 1200 },
  { label: 'A4 Print (595 × 842 pt)', width: 595, height: 842 },
  { label: 'iPhone 15 (393 × 852)', width: 393, height: 852 },
  { label: 'Иконка (512 × 512)', width: 512, height: 512 },
];

export const ArtboardPanel: React.FC<ArtboardPanelProps> = ({
  editor,
  artboard,
  onUpdateArtboard,
}) => {
  if (!editor) return null;

  const artboards = editor.viewport.getArtboards();
  const activeIndex = editor.viewport.getActiveArtboardIndex();

  const handleAddArtboard = () => {
    editor.viewport.addArtboard({
      width: artboard.width,
      height: artboard.height,
      backgroundColor: artboard.backgroundColor,
    });
    editor.renderArtboard();
    editor.history.pushState();
  };

  const handleRemoveArtboard = () => {
    if (artboards.length <= 1) return;
    editor.viewport.removeArtboard(activeIndex);
    editor.renderArtboard();
    editor.history.pushState();
  };

  const handleSelectArtboard = (idx: number) => {
    editor.viewport.setActiveArtboardIndex(idx);
    editor.renderArtboard();
    editor.viewport.fitArtboard(idx);
  };

  return (
    <div className="flex flex-col gap-3.5 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ai-textMuted uppercase tracking-wider flex items-center gap-1.5">
          <Monitor size={13} />
          Монтажные области (Artboards)
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.viewport.fitArtboard()}
            className="text-ai-accent hover:text-ai-accentHover p-1 rounded hover:bg-ai-darker flex items-center gap-1 text-[11px]"
            title="Вписать текущий артборд [Ctrl+0]"
          >
            <Maximize2 size={12} />
            Текущий
          </button>
          <button
            onClick={() => editor.viewport.fitAllArtboards()}
            className="text-ai-accent hover:text-ai-accentHover p-1 rounded hover:bg-ai-darker flex items-center gap-1 text-[11px]"
            title="Вписать все артборды"
          >
            <Layers size={12} />
            Все
          </button>
        </div>
      </div>

      {/* Artboards List & Switcher */}
      <div className="bg-ai-darker p-2 rounded border border-ai-border flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-ai-textMuted font-medium">Список артбордов:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleAddArtboard}
              className="p-1 hover:bg-ai-hover text-emerald-400 rounded flex items-center gap-1 text-[10px] font-medium"
              title="Добавить новый артборд"
            >
              <Plus size={13} />
              Добавить
            </button>
            {artboards.length > 1 && (
              <button
                onClick={handleRemoveArtboard}
                className="p-1 hover:bg-ai-hover text-red-400 rounded"
                title="Удалить активный артборд"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-0.5">
          {artboards.map((ab, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={ab.id || idx}
                onClick={() => handleSelectArtboard(idx)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-ai-accent text-white font-medium shadow-xs'
                    : 'bg-ai-darkest/70 hover:bg-ai-hover text-ai-textMuted hover:text-ai-textLight'
                }`}
              >
                <span className="truncate">{ab.name}</span>
                <span className="font-mono text-[10px] opacity-80 shrink-0">
                  {ab.width} × {ab.height}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Artboard Parameters */}
      <div className="bg-ai-darker p-2.5 rounded border border-ai-border flex flex-col gap-2.5">
        <div className="text-[10px] text-ai-textMuted font-medium">
          Параметры активного артборда:
        </div>

        {/* Presets dropdown */}
        <div>
          <label className="text-[10px] text-ai-textMuted block mb-1">Шаблоны размеров:</label>
          <select
            value=""
            onChange={(e) => {
              const preset = PRESETS.find((p) => `${p.width}x${p.height}` === e.target.value);
              if (preset) {
                onUpdateArtboard({ width: preset.width, height: preset.height });
                editor.renderArtboard();
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

        {/* Coordinates X and Y */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-ai-textMuted block mb-1">Позиция X:</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={artboard.x ?? 0}
                onChange={(e) => {
                  onUpdateArtboard({ x: parseInt(e.target.value) || 0 });
                  editor.renderArtboard();
                }}
                className="w-full bg-ai-darkest px-2 py-1 rounded border border-ai-border text-ai-textLight font-mono focus:border-ai-accent outline-none"
              />
              <span className="text-[10px] text-ai-textMuted">px</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-ai-textMuted block mb-1">Позиция Y:</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={artboard.y ?? 0}
                onChange={(e) => {
                  onUpdateArtboard({ y: parseInt(e.target.value) || 0 });
                  editor.renderArtboard();
                }}
                className="w-full bg-ai-darkest px-2 py-1 rounded border border-ai-border text-ai-textLight font-mono focus:border-ai-accent outline-none"
              />
              <span className="text-[10px] text-ai-textMuted">px</span>
            </div>
          </div>
        </div>

        {/* Width and Height */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-ai-textMuted block mb-1">Ширина (W):</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="50"
                max="10000"
                value={artboard.width}
                onChange={(e) => {
                  onUpdateArtboard({ width: Math.max(50, parseInt(e.target.value) || 50) });
                  editor.renderArtboard();
                }}
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
                min="50"
                max="10000"
                value={artboard.height}
                onChange={(e) => {
                  onUpdateArtboard({ height: Math.max(50, parseInt(e.target.value) || 50) });
                  editor.renderArtboard();
                }}
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
              onChange={(e) => {
                onUpdateArtboard({ backgroundColor: e.target.value });
                editor.renderArtboard();
              }}
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
