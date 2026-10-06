import React, { useState } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
} from 'lucide-react';
import type { Editor } from '../../core/Editor';
import type { AlignMode, AlignType, SelectionInfo } from '../../core/types';

interface AlignPanelProps {
  editor: Editor | null;
  selection: SelectionInfo;
}

export const AlignPanel: React.FC<AlignPanelProps> = ({ editor, selection }) => {
  const [alignMode, setAlignMode] = useState<AlignMode>('selection');

  if (!editor) return null;

  const hasSelection = selection.count > 0;
  const canAlign = alignMode === 'artboard' ? hasSelection : selection.count >= 2;

  const handleAlign = (type: AlignType) => {
    editor.align(type, alignMode);
  };

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ai-textMuted uppercase tracking-wider">
          Выравнивание (Align)
        </span>
        {/* Align Mode Toggle */}
        <select
          value={alignMode}
          onChange={(e) => setAlignMode(e.target.value as AlignMode)}
          className="bg-ai-darkest text-ai-textLight border border-ai-border text-[10px] rounded px-1.5 py-0.5 outline-none focus:border-ai-accent"
        >
          <option value="selection">По выделению</option>
          <option value="artboard">По артборду</option>
        </select>
      </div>

      <div className="bg-ai-darker p-2.5 rounded border border-ai-border flex flex-col gap-2.5">
        {/* Horizontal Alignment */}
        <div>
          <div className="text-[10px] text-ai-textMuted mb-1.5">По горизонтали:</div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              disabled={!canAlign}
              onClick={() => handleAlign('left')}
              title="По левому краю"
              className="py-1.5 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ai-textLight"
            >
              <AlignLeft size={16} />
            </button>
            <button
              disabled={!canAlign}
              onClick={() => handleAlign('horizontalCenter')}
              title="По центру"
              className="py-1.5 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ai-textLight"
            >
              <AlignCenter size={16} />
            </button>
            <button
              disabled={!canAlign}
              onClick={() => handleAlign('right')}
              title="По правому краю"
              className="py-1.5 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ai-textLight"
            >
              <AlignRight size={16} />
            </button>
          </div>
        </div>

        {/* Vertical Alignment */}
        <div>
          <div className="text-[10px] text-ai-textMuted mb-1.5">По вертикали:</div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              disabled={!canAlign}
              onClick={() => handleAlign('top')}
              title="По верхнему краю"
              className="py-1.5 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ai-textLight"
            >
              <AlignVerticalJustifyStart size={16} />
            </button>
            <button
              disabled={!canAlign}
              onClick={() => handleAlign('verticalCenter')}
              title="По середине"
              className="py-1.5 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ai-textLight"
            >
              <AlignVerticalJustifyCenter size={16} />
            </button>
            <button
              disabled={!canAlign}
              onClick={() => handleAlign('bottom')}
              title="По нижнему краю"
              className="py-1.5 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ai-textLight"
            >
              <AlignVerticalJustifyEnd size={16} />
            </button>
          </div>
        </div>

        {/* Distribute Spacing */}
        <div className="pt-2 border-t border-ai-border/50">
          <div className="text-[10px] text-ai-textMuted mb-1.5">Распределить интервалы:</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              disabled={selection.count < 3}
              onClick={() => handleAlign('distributeHorizontally')}
              title="Распределить по горизонтали (нужно 3+ объекта)"
              className="py-1.5 px-2 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-ai-textLight"
            >
              <AlignHorizontalSpaceBetween size={15} />
              <span className="text-[10px]">Горизонт.</span>
            </button>
            <button
              disabled={selection.count < 3}
              onClick={() => handleAlign('distributeVertically')}
              title="Распределить по вертикали (нужно 3+ объекта)"
              className="py-1.5 px-2 rounded bg-ai-panel hover:bg-ai-hover border border-ai-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-ai-textLight"
            >
              <AlignVerticalSpaceBetween size={15} />
              <span className="text-[10px]">Вертикаль.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
