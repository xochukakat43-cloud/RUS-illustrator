import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string | null;
  onSelectColor: (color: string | null) => void;
  title: string;
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

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  onSelectColor,
  title,
}) => {
  if (!isOpen) return null;

  const [hexValue, setHexValue] = useState(currentColor || '#000000');

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexValue(e.target.value);
    onSelectColor(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="w-80 rounded-lg border border-ai-border bg-ai-panel shadow-2xl p-4 text-ai-textLight">
        <div className="flex items-center justify-between pb-3 border-b border-ai-border">
          <span className="font-semibold text-sm">{title}</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
          >
            <X size={16} />
          </button>
        </div>

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
          <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto p-1 bg-ai-darkest rounded border border-ai-border">
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
