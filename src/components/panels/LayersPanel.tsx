import React from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Folder,
  FolderOpen,
  ChevronsUp,
  ChevronsDown,
  ChevronUp,
  ChevronDown,
  Layers,
  Shapes,
} from 'lucide-react';
import type { Editor } from '../../core/Editor';
import type { LayerNode, SelectionInfo } from '../../core/types';

interface LayersPanelProps {
  editor: Editor | null;
  layers: LayerNode[];
  selection: SelectionInfo;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ editor, layers, selection }) => {
  if (!editor) return null;

  const renderNode = (node: LayerNode) => {
    return (
      <div
        key={node.id}
        onClick={() => editor.selectItemById(node.id)}
        className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors text-xs ${
          node.selected
            ? 'bg-ai-accent/20 border border-ai-accent text-white'
            : 'hover:bg-ai-hover text-ai-textLight border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {node.type === 'group' ? (
            <Folder size={14} className="text-amber-400 shrink-0" />
          ) : (
            <Shapes size={14} className="text-ai-textMuted shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Visibility toggle */}
          <button
            onClick={() => editor.setItemVisibility(node.id, !node.visible)}
            className="p-1 hover:bg-ai-darkest rounded text-ai-textMuted hover:text-ai-textLight"
            title={node.visible ? 'Скрыть' : 'Показать'}
          >
            {node.visible ? <Eye size={13} /> : <EyeOff size={13} className="text-red-400" />}
          </button>

          {/* Lock toggle */}
          <button
            onClick={() => editor.setItemLock(node.id, !node.locked)}
            className="p-1 hover:bg-ai-darkest rounded text-ai-textMuted hover:text-ai-textLight"
            title={node.locked ? 'Разблокировать' : 'Заблокировать'}
          >
            {node.locked ? <Lock size={13} className="text-amber-400" /> : <Unlock size={13} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ai-textMuted uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={13} />
          Слои и объекты ({layers.length})
        </span>
        <button
          disabled={selection.count === 0}
          onClick={() => editor.selectionManager.deleteSelected()}
          className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded hover:bg-ai-darker"
          title="Удалить выделенное [Delete]"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Layer List */}
      <div className="h-48 overflow-y-auto bg-ai-darker p-1 rounded border border-ai-border flex flex-col gap-0.5">
        {layers.length > 0 ? (
          // In Illustrator, top layer items are rendered on top, so we reverse display
          [...layers].reverse().map(renderNode)
        ) : (
          <div className="h-full flex items-center justify-center text-ai-textMuted italic text-center text-[11px] p-4">
            Холст пуст. Нарисуйте фигуру или контур.
          </div>
        )}
      </div>

      {/* Arrangement & Grouping Quick Actions */}
      <div className="grid grid-cols-4 gap-1 bg-ai-darker p-1 rounded border border-ai-border">
        <button
          disabled={selection.count === 0}
          onClick={() => editor.bringToFront()}
          className="p-1.5 rounded hover:bg-ai-panel flex items-center justify-center text-ai-textLight disabled:opacity-30"
          title="На самый передний план [Ctrl+Shift+]]"
        >
          <ChevronsUp size={15} />
        </button>
        <button
          disabled={selection.count === 0}
          onClick={() => editor.bringForward()}
          className="p-1.5 rounded hover:bg-ai-panel flex items-center justify-center text-ai-textLight disabled:opacity-30"
          title="Переместить вперед [Ctrl+]]"
        >
          <ChevronUp size={15} />
        </button>
        <button
          disabled={selection.count === 0}
          onClick={() => editor.sendBackward()}
          className="p-1.5 rounded hover:bg-ai-panel flex items-center justify-center text-ai-textLight disabled:opacity-30"
          title="Переместить назад [Ctrl+[]"
        >
          <ChevronDown size={15} />
        </button>
        <button
          disabled={selection.count === 0}
          onClick={() => editor.sendToBack()}
          className="p-1.5 rounded hover:bg-ai-panel flex items-center justify-center text-ai-textLight disabled:opacity-30"
          title="На самый задний план [Ctrl+Shift+[]"
        >
          <ChevronsDown size={15} />
        </button>
      </div>

      {/* Group / Ungroup buttons */}
      <div className="flex gap-2">
        <button
          disabled={selection.count < 2}
          onClick={() => editor.group()}
          className="flex-1 py-1 rounded bg-ai-darker hover:bg-ai-hover border border-ai-border text-ai-textLight disabled:opacity-30 text-[11px]"
          title="Сгруппировать [Ctrl+G]"
        >
          Сгруппировать
        </button>
        <button
          disabled={!selection.isGroup}
          onClick={() => editor.ungroup()}
          className="flex-1 py-1 rounded bg-ai-darker hover:bg-ai-hover border border-ai-border text-ai-textLight disabled:opacity-30 text-[11px]"
          title="Разгруппировать [Ctrl+Shift+G]"
        >
          Разгруппировать
        </button>
      </div>
    </div>
  );
};
