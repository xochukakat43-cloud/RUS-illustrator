import React from 'react';
import {
  MousePointer,
  SquareDashedMousePointer,
  PenTool as PenIcon,
  Square,
  Circle,
  Slash,
  Hand,
  ZoomIn,
  ArrowLeftRight,
} from 'lucide-react';
import type { ActiveStyle, ToolType } from '../../core/types';

interface LeftToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  activeStyle: ActiveStyle;
  onOpenColorPicker: (type: 'fill' | 'stroke') => void;
  onSwapColors: () => void;
  onResetColors: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  onSelectTool,
  activeStyle,
  onOpenColorPicker,
  onSwapColors,
  onResetColors,
}) => {
  const tools: { type: ToolType; label: string; shortcut: string; icon: React.ReactNode }[] = [
    { type: 'select', label: 'Выделение (Selection Tool)', shortcut: 'V', icon: <MousePointer size={18} /> },
    { type: 'direct-select', label: 'Прямое выделение (Direct Selection)', shortcut: 'A', icon: <SquareDashedMousePointer size={18} /> },
    { type: 'pen', label: 'Перо Безье (Pen Tool)', shortcut: 'P', icon: <PenIcon size={18} /> },
    { type: 'rectangle', label: 'Прямоугольник (Rectangle)', shortcut: 'M', icon: <Square size={18} /> },
    { type: 'ellipse', label: 'Эллипс (Ellipse)', shortcut: 'L', icon: <Circle size={18} /> },
    { type: 'line', label: 'Отрезок (Line Tool)', shortcut: '\\', icon: <Slash size={18} className="rotate-45" /> },
    { type: 'pan', label: 'Рука / Панорамирование (Hand Tool)', shortcut: 'H / Space', icon: <Hand size={18} /> },
    { type: 'zoom', label: 'Масштаб (Zoom Tool)', shortcut: 'Z', icon: <ZoomIn size={18} /> },
  ];

  return (
    <aside className="w-13 bg-ai-panel border-r border-ai-border flex flex-col items-center py-2.5 z-20 select-none shadow-md shrink-0">
      {/* Tool Buttons */}
      <div className="flex flex-col gap-1 w-full px-1.5">
        {tools.map((t) => {
          const isActive = activeTool === t.type;
          return (
            <button
              key={t.type}
              onClick={() => onSelectTool(t.type)}
              title={`${t.label} [${t.shortcut}]`}
              className={`relative flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
                isActive
                  ? 'bg-ai-accent text-white shadow-xs'
                  : 'text-ai-textMuted hover:bg-ai-hover hover:text-ai-textLight'
              }`}
            >
              {t.icon}
              {/* Shortcut small corner tag */}
              <span className="absolute bottom-0.5 right-1 text-[9px] opacity-60 font-mono">
                {t.shortcut.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-8 h-[1px] bg-ai-border my-3" />

      {/* Illustrator Iconic Overlapping Color Swatches */}
      <div className="relative w-10 h-10 mt-1">
        {/* Stroke Swatch (Bottom-right) */}
        <button
          onClick={() => onOpenColorPicker('stroke')}
          title="Цвет обводки (Stroke)"
          className="absolute right-0 bottom-0 w-6 h-6 rounded-xs border-2 border-ai-border hover:border-ai-accent transition-colors shadow-xs z-0"
          style={{
            backgroundColor: activeStyle.strokeColor || 'transparent',
            backgroundImage: !activeStyle.strokeColor
              ? 'linear-gradient(45deg, transparent 40%, #ef4444 45%, #ef4444 55%, transparent 60%)'
              : undefined,
          }}
        />

        {/* Fill Swatch (Top-left) */}
        <button
          onClick={() => onOpenColorPicker('fill')}
          title="Цвет заливки (Fill)"
          className="absolute left-0 top-0 w-6 h-6 rounded-xs border-2 border-ai-border hover:border-ai-accent transition-colors shadow-md z-10"
          style={{
            backgroundColor: activeStyle.fillColor || 'transparent',
            backgroundImage: !activeStyle.fillColor
              ? 'linear-gradient(45deg, transparent 40%, #ef4444 45%, #ef4444 55%, transparent 60%)'
              : undefined,
          }}
        />

        {/* Swap button (top-right mini arrow) */}
        <button
          onClick={onSwapColors}
          title="Поменять заливку и обводку местами [X]"
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-ai-header hover:bg-ai-hover border border-ai-border rounded-full flex items-center justify-center text-ai-textLight shadow-xs z-20 cursor-pointer"
        >
          <ArrowLeftRight size={9} />
        </button>

        {/* Reset Default Colors (bottom-left mini D button) */}
        <button
          onClick={onResetColors}
          title="Цвета по умолчанию (Белый/Черный) [D]"
          className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-ai-header hover:bg-ai-hover border border-ai-border rounded-full flex items-center justify-center text-ai-textMuted hover:text-ai-textLight text-[8px] font-bold shadow-xs z-20 cursor-pointer"
        >
          D
        </button>
      </div>
    </aside>
  );
};
