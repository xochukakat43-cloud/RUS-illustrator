import React from 'react';
import type { Editor } from '../../core/Editor';
import type { SelectionInfo } from '../../core/types';

interface PathfinderPanelProps {
  editor: Editor | null;
  selection: SelectionInfo;
}

export const PathfinderPanel: React.FC<PathfinderPanelProps> = ({ editor, selection }) => {
  if (!editor) return null;

  const canExecute = selection.count >= 2;

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="text-[11px] font-semibold text-ai-textMuted uppercase tracking-wider">
        Режимы формы (Shape Modes)
      </div>

      <div className="grid grid-cols-4 gap-2 bg-ai-darker p-2 rounded border border-ai-border">
        {/* Unite */}
        <button
          disabled={!canExecute}
          onClick={() => editor.pathfinder('unite')}
          title="Объединить (Unite): сливает выделенные фигуры в единый контур"
          className="flex flex-col items-center justify-center p-2 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-ai-textLight group-hover:text-ai-accent">
            <rect x="3" y="7" width="11" height="11" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9" y="3" width="11" height="11" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 7 h6 v-4 h11 v11 h-4 v6 h-13 z" fill="currentColor" />
          </svg>
          <span className="text-[9px] mt-1.5 text-ai-textMuted group-hover:text-ai-textLight">Слияние</span>
        </button>

        {/* Minus Front */}
        <button
          disabled={!canExecute}
          onClick={() => editor.pathfinder('subtract')}
          title="Минус верхний (Minus Front): вычитает верхнюю фигуру из нижней"
          className="flex flex-col items-center justify-center p-2 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-ai-textLight group-hover:text-ai-accent">
            <rect x="3" y="7" width="11" height="11" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9" y="3" width="11" height="11" fill="#282828" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2,2" />
          </svg>
          <span className="text-[9px] mt-1.5 text-ai-textMuted group-hover:text-ai-textLight">Минус</span>
        </button>

        {/* Intersect */}
        <button
          disabled={!canExecute}
          onClick={() => editor.pathfinder('intersect')}
          title="Пересечение (Intersect): оставляет только общую область фигур"
          className="flex flex-col items-center justify-center p-2 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-ai-textLight group-hover:text-ai-accent">
            <rect x="3" y="7" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2,2" />
            <rect x="9" y="3" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2,2" />
            <rect x="9" y="7" width="5" height="7" fill="currentColor" />
          </svg>
          <span className="text-[9px] mt-1.5 text-ai-textMuted group-hover:text-ai-textLight">Пересечь</span>
        </button>

        {/* Exclude */}
        <button
          disabled={!canExecute}
          onClick={() => editor.pathfinder('exclude')}
          title="Исключение (Exclude): удаляет пересекающиеся части"
          className="flex flex-col items-center justify-center p-2 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-ai-textLight group-hover:text-ai-accent">
            <rect x="3" y="7" width="6" height="11" fill="currentColor" />
            <rect x="9" y="14" width="5" height="4" fill="currentColor" />
            <rect x="9" y="3" width="11" height="4" fill="currentColor" />
            <rect x="14" y="7" width="6" height="7" fill="currentColor" />
          </svg>
          <span className="text-[9px] mt-1.5 text-ai-textMuted group-hover:text-ai-textLight">Исключить</span>
        </button>
      </div>

      {!canExecute && (
        <div className="text-[10px] text-ai-textMuted italic bg-ai-darkest p-2 rounded border border-ai-border">
          💡 Выделите 2 или более контуров (Shift+клик или рамка), чтобы применить булевы операции.
        </div>
      )}
    </div>
  );
};
