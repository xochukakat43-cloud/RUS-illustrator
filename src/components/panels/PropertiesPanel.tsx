import React from 'react';
import { CornerDownRight, Spline, ShieldAlert } from 'lucide-react';
import type { ActiveStyle, DirectSelectionInfo, SelectionInfo } from '../../core/types';
import type { Editor } from '../../core/Editor';

interface PropertiesPanelProps {
  editor: Editor | null;
  selection: SelectionInfo;
  directSelection: DirectSelectionInfo;
  activeStyle: ActiveStyle;
  onOpenColorPicker: (type: 'fill' | 'stroke') => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  editor,
  selection,
  directSelection,
  activeStyle,
  onOpenColorPicker,
}) => {
  if (!editor) return null;

  const hasSelection = selection.count > 0;
  const bounds = selection.bounds;

  const handleBoundsChange = (prop: 'x' | 'y' | 'width' | 'height', val: number) => {
    if (!bounds) return;
    const newBounds = { ...bounds, [prop]: Math.max(1, val) };
    editor.selectionManager.applyBounds(newBounds);
  };

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Transform Section */}
      <div>
        <div className="text-[11px] font-semibold text-ai-textMuted uppercase tracking-wider mb-2">
          Трансформация (Transform)
        </div>
        {hasSelection && bounds ? (
          <div className="grid grid-cols-2 gap-2 bg-ai-darker p-2.5 rounded border border-ai-border">
            <div className="flex items-center gap-1.5">
              <span className="text-ai-textMuted font-mono text-[10px]">X:</span>
              <input
                type="number"
                value={bounds.x}
                onChange={(e) => handleBoundsChange('x', parseFloat(e.target.value) || 0)}
                className="w-full bg-ai-darkest px-2 py-1 rounded border border-ai-border text-ai-textLight font-mono focus:border-ai-accent outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-ai-textMuted font-mono text-[10px]">Y:</span>
              <input
                type="number"
                value={bounds.y}
                onChange={(e) => handleBoundsChange('y', parseFloat(e.target.value) || 0)}
                className="w-full bg-ai-darkest px-2 py-1 rounded border border-ai-border text-ai-textLight font-mono focus:border-ai-accent outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-ai-textMuted font-mono text-[10px]">W:</span>
              <input
                type="number"
                value={bounds.width}
                onChange={(e) => handleBoundsChange('width', parseFloat(e.target.value) || 1)}
                className="w-full bg-ai-darkest px-2 py-1 rounded border border-ai-border text-ai-textLight font-mono focus:border-ai-accent outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-ai-textMuted font-mono text-[10px]">H:</span>
              <input
                type="number"
                value={bounds.height}
                onChange={(e) => handleBoundsChange('height', parseFloat(e.target.value) || 1)}
                className="w-full bg-ai-darkest px-2 py-1 rounded border border-ai-border text-ai-textLight font-mono focus:border-ai-accent outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="text-ai-textMuted italic bg-ai-darker p-2.5 rounded border border-ai-border text-center">
            Нет выделенных объектов
          </div>
        )}
      </div>

      {/* Anchor Points conversion for Direct Selection */}
      {directSelection.selectedSegmentCount > 0 && (
        <div className="bg-ai-darker p-2.5 rounded border border-ai-border">
          <div className="text-[11px] font-semibold text-ai-textMuted uppercase tracking-wider mb-2">
            Тип опорной точки (Anchor)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => editor.selectionManager.convertPointToCorner()}
              className="flex-1 py-1 px-2 rounded border border-ai-border bg-ai-panel hover:bg-ai-hover flex items-center justify-center gap-1.5"
              title="Сделать острым углом (Corner Point)"
            >
              <CornerDownRight size={13} />
              Острый угол
            </button>
            <button
              onClick={() => editor.selectionManager.convertPointToSmooth()}
              className="flex-1 py-1 px-2 rounded border border-ai-border bg-ai-panel hover:bg-ai-hover flex items-center justify-center gap-1.5"
              title="Сделать сглаженным (Smooth Point)"
            >
              <Spline size={13} />
              Сгладить
            </button>
          </div>
        </div>
      )}

      {/* Appearance Section */}
      <div>
        <div className="text-[11px] font-semibold text-ai-textMuted uppercase tracking-wider mb-2">
          Оформление (Appearance)
        </div>
        <div className="flex flex-col gap-2.5 bg-ai-darker p-2.5 rounded border border-ai-border">
          {/* Fill row */}
          <div className="flex items-center justify-between">
            <span className="text-ai-textLight font-medium">Заливка (Fill):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenColorPicker('fill')}
                className="w-6 h-6 rounded border border-ai-border hover:border-ai-accent transition-colors shadow-xs"
                style={{
                  backgroundColor: activeStyle.fillColor || 'transparent',
                  backgroundImage: !activeStyle.fillColor
                    ? 'linear-gradient(45deg, transparent 40%, #ef4444 45%, #ef4444 55%, transparent 60%)'
                    : undefined,
                }}
              />
              <span className="font-mono text-ai-textMuted w-16 text-right">
                {activeStyle.fillColor || 'None'}
              </span>
            </div>
          </div>

          {/* Stroke row */}
          <div className="flex items-center justify-between">
            <span className="text-ai-textLight font-medium">Обводка (Stroke):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenColorPicker('stroke')}
                className="w-6 h-6 rounded border border-ai-border hover:border-ai-accent transition-colors shadow-xs"
                style={{
                  backgroundColor: activeStyle.strokeColor || 'transparent',
                  backgroundImage: !activeStyle.strokeColor
                    ? 'linear-gradient(45deg, transparent 40%, #ef4444 45%, #ef4444 55%, transparent 60%)'
                    : undefined,
                }}
              />
              <span className="font-mono text-ai-textMuted w-16 text-right">
                {activeStyle.strokeColor || 'None'}
              </span>
            </div>
          </div>

          {/* Stroke Width */}
          <div className="flex items-center justify-between pt-1 border-t border-ai-border/50">
            <span className="text-ai-textLight font-medium">Толщина линии:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="100"
                value={activeStyle.strokeWidth}
                onChange={(e) =>
                  editor.setActiveStyle({ strokeWidth: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                className="w-16 bg-ai-darkest px-2 py-0.5 rounded border border-ai-border text-ai-textLight font-mono focus:border-ai-accent outline-none text-right"
              />
              <span className="text-ai-textMuted text-[10px]">pt</span>
            </div>
          </div>

          {/* Opacity */}
          <div className="flex items-center justify-between pt-1 border-t border-ai-border/50">
            <span className="text-ai-textLight font-medium">Непрозрачность:</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={activeStyle.opacity}
                onChange={(e) => editor.setActiveStyle({ opacity: parseFloat(e.target.value) })}
                className="w-20 accent-ai-accent cursor-pointer"
              />
              <span className="font-mono text-ai-textMuted w-9 text-right">
                {Math.round(activeStyle.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
