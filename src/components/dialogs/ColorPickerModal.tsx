import React, { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import type { GradientDef, GradientStop } from '../../core/types';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string | null;
  currentGradient?: GradientDef | null;
  onSelectColor: (color: string | null) => void;
  onSelectGradient?: (gradient: GradientDef) => void;
  title: string;
  allowGradient?: boolean;
}

const PRESET_SWATCHES = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#33cc33', '#0099ff', '#6633cc',
  '#ff3399', '#990000', '#cc3300', '#ff9900', '#006600', '#003399',
  '#330066', '#990066', '#ff9999', '#ffcc99', '#ffff99', '#99ff99',
  '#99ccff', '#cc99ff', '#ff99cc', '#f44336', '#e91e63', '#9c27b0',
  '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688',
  '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
];

const PRESET_GRADIENTS: { name: string; gradient: GradientDef }[] = [
  {
    name: 'Закат (Sunset)',
    gradient: {
      type: 'linear',
      stops: [
        { color: '#ff512f', offset: 0 },
        { color: '#dd2476', offset: 1 },
      ],
    },
  },
  {
    name: 'Океан (Ocean)',
    gradient: {
      type: 'linear',
      stops: [
        { color: '#00c6ff', offset: 0 },
        { color: '#0072ff', offset: 1 },
      ],
    },
  },
  {
    name: 'Изумруд (Emerald)',
    gradient: {
      type: 'linear',
      stops: [
        { color: '#11998e', offset: 0 },
        { color: '#38ef7d', offset: 1 },
      ],
    },
  },
  {
    name: 'Киберпанк (Cyberpunk)',
    gradient: {
      type: 'linear',
      stops: [
        { color: '#f72585', offset: 0 },
        { color: '#7209b7', offset: 0.5 },
        { color: '#4cc9f0', offset: 1 },
      ],
    },
  },
  {
    name: 'Пламя (Fire)',
    gradient: {
      type: 'linear',
      stops: [
        { color: '#f12711', offset: 0 },
        { color: '#f5af19', offset: 1 },
      ],
    },
  },
  {
    name: 'Тёмный металл (Dark Metal)',
    gradient: {
      type: 'linear',
      stops: [
        { color: '#232526', offset: 0 },
        { color: '#414345', offset: 1 },
      ],
    },
  },
  {
    name: 'Пастель (Pastel)',
    gradient: {
      type: 'linear',
      stops: [
        { color: '#ff9a9e', offset: 0 },
        { color: '#fecfef', offset: 0.6 },
        { color: '#a1c4fd', offset: 1 },
      ],
    },
  },
  {
    name: 'Радиальное сияние',
    gradient: {
      type: 'radial',
      stops: [
        { color: '#ffffff', offset: 0 },
        { color: '#3b82f6', offset: 0.7 },
        { color: '#1e3a8a', offset: 1 },
      ],
    },
  },
];

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  currentGradient,
  onSelectColor,
  onSelectGradient,
  title,
  allowGradient = true,
}) => {
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient'>(
    currentGradient ? 'gradient' : 'solid'
  );
  const [hexValue, setHexValue] = useState(currentColor || '#000000');

  // Gradient state
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>(
    currentGradient?.type || 'linear'
  );
  const [stops, setStops] = useState<GradientStop[]>(
    currentGradient?.stops && currentGradient.stops.length >= 2
      ? currentGradient.stops
      : [
          { color: '#3b82f6', offset: 0 },
          { color: '#9333ea', offset: 1 },
        ]
  );
  const [activeStopIndex, setActiveStopIndex] = useState(0);

  if (!isOpen) return null;

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexValue(e.target.value);
    onSelectColor(e.target.value);
  };

  const handleApplyGradient = (type = gradientType, newStops = stops) => {
    if (onSelectGradient) {
      onSelectGradient({
        type,
        stops: [...newStops].sort((a, b) => a.offset - b.offset),
      });
    }
  };

  const handleStopColorChange = (color: string) => {
    const updated = stops.map((s, idx) => (idx === activeStopIndex ? { ...s, color } : s));
    setStops(updated);
    handleApplyGradient(gradientType, updated);
  };

  const handleStopOffsetChange = (offset: number) => {
    const updated = stops.map((s, idx) =>
      idx === activeStopIndex ? { ...s, offset: Math.max(0, Math.min(1, offset)) } : s
    );
    setStops(updated);
    handleApplyGradient(gradientType, updated);
  };

  const handleAddStop = () => {
    const newStop: GradientStop = { color: '#ffffff', offset: 0.5 };
    const updated = [...stops, newStop].sort((a, b) => a.offset - b.offset);
    setStops(updated);
    setActiveStopIndex(updated.indexOf(newStop));
    handleApplyGradient(gradientType, updated);
  };

  const handleDeleteStop = () => {
    if (stops.length <= 2) return;
    const updated = stops.filter((_, idx) => idx !== activeStopIndex);
    setStops(updated);
    setActiveStopIndex(0);
    handleApplyGradient(gradientType, updated);
  };

  const handleSelectPresetGradient = (preset: GradientDef) => {
    setGradientType(preset.type);
    setStops(preset.stops);
    setActiveStopIndex(0);
    handleApplyGradient(preset.type, preset.stops);
  };

  // Generate CSS background for the gradient preview bar
  const gradientCss =
    gradientType === 'radial'
      ? `radial-gradient(circle, ${[...stops]
          .sort((a, b) => a.offset - b.offset)
          .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
          .join(', ')})`
      : `linear-gradient(90deg, ${[...stops]
          .sort((a, b) => a.offset - b.offset)
          .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
          .join(', ')})`;

  const activeStop = stops[activeStopIndex] || stops[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="w-88 rounded-lg border border-ai-border bg-ai-panel shadow-2xl p-4 text-ai-textLight">
        <div className="flex items-center justify-between pb-2 border-b border-ai-border">
          <span className="font-semibold text-sm">{title}</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Tabs: Solid vs Gradient */}
        {allowGradient && (
          <div className="flex bg-ai-darkest p-0.5 rounded border border-ai-border mt-3 text-xs">
            <button
              onClick={() => setActiveTab('solid')}
              className={`flex-1 py-1 rounded font-medium transition-colors ${
                activeTab === 'solid' ? 'bg-ai-accent text-white shadow-xs' : 'text-ai-textMuted hover:text-ai-textLight'
              }`}
            >
              Сплошной цвет
            </button>
            <button
              onClick={() => {
                setActiveTab('gradient');
                handleApplyGradient();
              }}
              className={`flex-1 py-1 rounded font-medium transition-colors ${
                activeTab === 'gradient' ? 'bg-ai-accent text-white shadow-xs' : 'text-ai-textMuted hover:text-ai-textLight'
              }`}
            >
              Градиент
            </button>
          </div>
        )}

        {/* SOLID COLOR VIEW */}
        {activeTab === 'solid' && (
          <>
            {/* Custom native picker & Hex input */}
            <div className="mt-4 flex items-center gap-3">
              <input
                type="color"
                value={currentColor || '#000000'}
                onChange={handleCustomChange}
                className="w-10 h-10 rounded border border-ai-border cursor-pointer bg-transparent"
              />
              <div className="flex-1">
                <label className="text-xs text-ai-textMuted block mb-1">HEX Color</label>
                <input
                  type="text"
                  value={hexValue}
                  onChange={(e) => {
                    setHexValue(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      onSelectColor(e.target.value);
                    }
                  }}
                  placeholder="#ffffff"
                  className="w-full bg-ai-darker border border-ai-border rounded px-2.5 py-1 text-sm font-mono focus:border-ai-accent outline-none"
                />
              </div>
            </div>

            {/* None / Transparent Button */}
            <div className="mt-3">
              <button
                onClick={() => {
                  onSelectColor(null);
                  onClose();
                }}
                className="w-full py-1.5 px-3 rounded border border-ai-border bg-ai-darker hover:bg-ai-hover text-xs font-medium flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 rounded-xs border border-red-500 relative overflow-hidden bg-white">
                  <div className="absolute inset-0 border-t-2 border-red-500 rotate-45 top-1.5" />
                </div>
                Без цвета (Transparent / None)
              </button>
            </div>

            {/* Swatches Grid */}
            <div className="mt-4">
              <div className="text-xs text-ai-textMuted mb-2">Палитра образцов:</div>
              <div className="grid grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-1 bg-ai-darkest rounded border border-ai-border">
                {PRESET_SWATCHES.map((swatch, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setHexValue(swatch);
                      onSelectColor(swatch);
                    }}
                    className={`w-7 h-7 rounded-xs border transition-transform hover:scale-110 ${
                      currentColor?.toLowerCase() === swatch.toLowerCase()
                        ? 'border-ai-accent ring-1 ring-ai-accent'
                        : 'border-ai-border'
                    }`}
                    style={{ backgroundColor: swatch }}
                    title={swatch}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* GRADIENT VIEW */}
        {activeTab === 'gradient' && (
          <div className="mt-3 flex flex-col gap-3">
            {/* Linear vs Radial Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setGradientType('linear');
                  handleApplyGradient('linear');
                }}
                className={`flex-1 py-1 px-2 rounded border text-xs font-medium ${
                  gradientType === 'linear'
                    ? 'bg-ai-accent border-ai-accent text-white shadow-xs'
                    : 'bg-ai-darkest border-ai-border text-ai-textMuted hover:text-ai-textLight'
                }`}
              >
                Линейный (Linear)
              </button>
              <button
                onClick={() => {
                  setGradientType('radial');
                  handleApplyGradient('radial');
                }}
                className={`flex-1 py-1 px-2 rounded border text-xs font-medium ${
                  gradientType === 'radial'
                    ? 'bg-ai-accent border-ai-accent text-white shadow-xs'
                    : 'bg-ai-darkest border-ai-border text-ai-textMuted hover:text-ai-textLight'
                }`}
              >
                Радиальный (Radial)
              </button>
            </div>

            {/* Gradient Slider Track */}
            <div>
              <div className="flex justify-between items-center text-[11px] text-ai-textMuted mb-1">
                <span>Шкала градиента:</span>
                <span className="text-[10px] opacity-70">Кликните по точке для настройки</span>
              </div>
              <div
                className="relative h-6 w-full rounded border border-ai-border shadow-inner"
                style={{ backgroundImage: gradientCss }}
              >
                {/* Visual Stop Markers */}
                {stops.map((stop, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStopIndex(idx)}
                    className={`absolute top-0 bottom-0 w-3 -ml-1.5 rounded-xs border-2 shadow-md transition-transform ${
                      activeStopIndex === idx
                        ? 'border-white scale-125 z-20 ring-1 ring-black'
                        : 'border-gray-800 z-10 hover:scale-110'
                    }`}
                    style={{
                      left: `${stop.offset * 100}%`,
                      backgroundColor: stop.color,
                    }}
                    title={`Точка #${idx + 1} (${Math.round(stop.offset * 100)}%)`}
                  />
                ))}
              </div>
            </div>

            {/* Selected Stop Controls */}
            {activeStop && (
              <div className="bg-ai-darker p-2.5 rounded border border-ai-border flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeStop.color}
                      onChange={(e) => handleStopColorChange(e.target.value)}
                      className="w-7 h-7 rounded border border-ai-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={activeStop.color}
                      onChange={(e) => {
                        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                          handleStopColorChange(e.target.value);
                        }
                      }}
                      className="w-20 bg-ai-darkest border border-ai-border rounded px-1.5 py-0.5 text-xs font-mono outline-none"
                    />
                  </div>

                  {/* Offset % Slider */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-ai-textMuted">Позиция:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(activeStop.offset * 100)}
                      onChange={(e) =>
                        handleStopOffsetChange((parseInt(e.target.value) || 0) / 100)
                      }
                      className="w-12 bg-ai-darkest border border-ai-border rounded px-1 py-0.5 text-xs font-mono text-center outline-none"
                    />
                    <span className="text-[10px] text-ai-textMuted">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-ai-border/60">
                  <button
                    onClick={handleAddStop}
                    className="flex items-center gap-1 text-[11px] text-ai-accent hover:underline py-0.5"
                  >
                    <Plus size={12} />
                    Добавить точку
                  </button>

                  {stops.length > 2 && (
                    <button
                      onClick={handleDeleteStop}
                      className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 py-0.5"
                    >
                      <Trash2 size={12} />
                      Удалить точку
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Preset Gradients Grid */}
            <div>
              <div className="text-xs text-ai-textMuted mb-1.5">Готовые градиенты:</div>
              <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto p-1 bg-ai-darkest rounded border border-ai-border">
                {PRESET_GRADIENTS.map((p, idx) => {
                  const bg =
                    p.gradient.type === 'radial'
                      ? `radial-gradient(circle, ${p.gradient.stops
                          .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
                          .join(', ')})`
                      : `linear-gradient(90deg, ${p.gradient.stops
                          .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
                          .join(', ')})`;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectPresetGradient(p.gradient)}
                      className="h-7 rounded border border-ai-border hover:scale-105 transition-transform shadow-xs"
                      style={{ backgroundImage: bg }}
                      title={p.name}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-ai-border">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-ai-accent hover:bg-ai-accentHover text-white rounded text-xs font-medium"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
