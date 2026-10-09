import React, { useRef } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  FolderOpen,
  Save,
  FilePlus,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Ruler,
  Sparkles,
  Split,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from 'lucide-react';
import type { Editor } from '../../core/Editor';
import type { ActiveStyle, GridConfig, GuidesConfig, SelectionInfo, ViewportState } from '../../core/types';

interface TopControlBarProps {
  editor: Editor | null;
  viewport: ViewportState;
  gridConfig: GridConfig;
  guidesConfig: GuidesConfig;
  selection: SelectionInfo;
  activeStyle: ActiveStyle;
  historyState: { canUndo: boolean; canRedo: boolean };
  onToggleGrid: () => void;
  onToggleSnapToGrid: () => void;
  onToggleRulers: () => void;
  onToggleGuides: () => void;
  onToggleSmartGuides: () => void;
  onOpenExportModal: () => void;
  onOpenColorPicker: (type: 'fill' | 'stroke') => void;
}

export const TopControlBar: React.FC<TopControlBarProps> = ({
  editor,
  viewport,
  gridConfig,
  guidesConfig,
  selection,
  activeStyle,
  historyState,
  onToggleGrid,
  onToggleSnapToGrid,
  onToggleRulers,
  onToggleGuides,
  onToggleSmartGuides,
  onOpenExportModal,
  onOpenColorPicker,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleOpenProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        editor.loadProjectFile(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportSvg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        editor.importSVGString(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleNewProject = () => {
    if (window.confirm('Создать новый документ? Все несохраненные изменения будут сброшены.')) {
      editor.getMainLayer().removeChildren();
      editor.history.clear();
      editor.history.pushState();
    }
  };

  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <header className="h-11 bg-ai-header border-b border-ai-border px-3 flex items-center justify-between select-none z-30 shadow-xs shrink-0 text-xs">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.ai.json"
        className="hidden"
        onChange={handleOpenProject}
      />
      <input
        ref={svgInputRef}
        type="file"
        accept=".svg"
        className="hidden"
        onChange={handleImportSvg}
      />

      {/* Left Section: Logo & File Operations */}
      <div className="flex items-center gap-3">
        {/* Illustrator Badge */}
        <div className="flex items-center gap-2 pr-2 border-r border-ai-border">
          <div className="w-6 h-6 bg-amber-600 rounded flex items-center justify-center font-bold text-white text-xs tracking-tighter shadow-xs">
            Ai
          </div>
          <span className="font-semibold text-ai-textLight text-xs hidden sm:inline">
            Vector Studio
          </span>
        </div>

        {/* File Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewProject}
            title="Новый документ"
            className="p-1.5 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight flex items-center gap-1"
          >
            <FilePlus size={15} />
            <span className="hidden md:inline text-[11px]">Новый</span>
          </button>
          <button
            onClick={() => {
              if (window.electronAPI?.isElectron) {
                editor.openProjectFile();
              } else {
                fileInputRef.current?.click();
              }
            }}
            title="Открыть проект (.json)"
            className="p-1.5 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight flex items-center gap-1"
          >
            <FolderOpen size={15} />
            <span className="hidden md:inline text-[11px]">Открыть</span>
          </button>
          <button
            onClick={() => editor.saveProjectFile()}
            title="Сохранить проект на диск (.ai.json)"
            className="p-1.5 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight flex items-center gap-1"
          >
            <Save size={15} />
            <span className="hidden md:inline text-[11px]">Сохранить</span>
          </button>
          <button
            onClick={() => svgInputRef.current?.click()}
            title="Импортировать векторный файл (.svg)"
            className="p-1.5 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight flex items-center gap-1"
          >
            <Upload size={15} />
            <span className="hidden lg:inline text-[11px]">Импорт SVG</span>
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pl-2 border-l border-ai-border">
          <button
            disabled={!historyState.canUndo}
            onClick={() => editor.history.undo()}
            title="Отменить [Ctrl+Z]"
            className="p-1.5 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 size={15} />
          </button>
          <button
            disabled={!historyState.canRedo}
            onClick={() => editor.history.redo()}
            title="Повторить [Ctrl+Y / Ctrl+Shift+Z]"
            className="p-1.5 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 size={15} />
          </button>
        </div>
      </div>

      {/* Center Section: Quick Properties & Align */}
      <div className="hidden lg:flex items-center gap-4 px-3 py-0.5 bg-ai-darker rounded border border-ai-border">
        {/* Fill & Stroke Quick Pickers */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-ai-textMuted">Заливка:</span>
            <button
              onClick={() => onOpenColorPicker('fill')}
              className="w-4 h-4 rounded-xs border border-ai-border hover:border-ai-accent"
              style={{
                backgroundColor: activeStyle.fillColor || 'transparent',
                backgroundImage: !activeStyle.fillColor
                  ? 'linear-gradient(45deg, transparent 40%, #ef4444 45%, #ef4444 55%, transparent 60%)'
                  : undefined,
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-ai-textMuted">Обводка:</span>
            <button
              onClick={() => onOpenColorPicker('stroke')}
              className="w-4 h-4 rounded-xs border border-ai-border hover:border-ai-accent"
              style={{
                backgroundColor: activeStyle.strokeColor || 'transparent',
                backgroundImage: !activeStyle.strokeColor
                  ? 'linear-gradient(45deg, transparent 40%, #ef4444 45%, #ef4444 55%, transparent 60%)'
                  : undefined,
              }}
            />
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-1 pl-1">
            <input
              type="number"
              min="0"
              max="50"
              value={activeStyle.strokeWidth}
              onChange={(e) =>
                editor.setActiveStyle({
                  strokeWidth: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-11 bg-ai-darkest px-1 py-0.5 rounded border border-ai-border text-center text-xs font-mono outline-none focus:border-ai-accent"
            />
            <span className="text-[10px] text-ai-textMuted">pt</span>
          </div>
        </div>

        {/* Quick Align Buttons if selection active */}
        {selection.count >= 2 && (
          <div className="flex items-center gap-1 pl-2 border-l border-ai-border">
            <button
              onClick={() => editor.align('left')}
              title="Выровнять влево"
              className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
            >
              <AlignLeft size={13} />
            </button>
            <button
              onClick={() => editor.align('horizontalCenter')}
              title="Выровнять по центру"
              className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
            >
              <AlignCenter size={13} />
            </button>
            <button
              onClick={() => editor.align('right')}
              title="Выровнять вправо"
              className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
            >
              <AlignRight size={13} />
            </button>
            <button
              onClick={() => editor.align('top')}
              title="Выровнять по верху"
              className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
            >
              <AlignVerticalJustifyStart size={13} />
            </button>
            <button
              onClick={() => editor.align('verticalCenter')}
              title="Выровнять по середине"
              className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
            >
              <AlignVerticalJustifyCenter size={13} />
            </button>
            <button
              onClick={() => editor.align('bottom')}
              title="Выровнять по низу"
              className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
            >
              <AlignVerticalJustifyEnd size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Right Section: Grid, Snap, Zoom & Export */}
      <div className="flex items-center gap-2">
        {/* Grid, Snap, Rulers & Guides Buttons */}
        <div className="flex items-center gap-0.5 bg-ai-darker p-0.5 rounded border border-ai-border">
          <button
            onClick={onToggleGrid}
            title={`Сетка документа (Ctrl+') [${gridConfig.showGrid ? 'Включена' : 'Выключена'}]`}
            className={`p-1.5 rounded transition-colors ${
              gridConfig.showGrid
                ? 'bg-ai-accent text-white shadow-xs'
                : 'text-ai-textMuted hover:bg-ai-hover hover:text-ai-textLight'
            }`}
          >
            <Grid size={14} />
          </button>
          <button
            onClick={onToggleSnapToGrid}
            title={`Привязка к сетке [${gridConfig.snapToGrid ? 'Включена' : 'Выключена'}]`}
            className={`p-1.5 rounded transition-colors ${
              gridConfig.snapToGrid
                ? 'bg-ai-accent text-white shadow-xs'
                : 'text-ai-textMuted hover:bg-ai-hover hover:text-ai-textLight'
            }`}
          >
            <Magnet size={14} />
          </button>
          <button
            onClick={onToggleRulers}
            title={`Линейки (Ctrl+R) [${guidesConfig.showRulers ? 'Включены' : 'Выключены'}]`}
            className={`p-1.5 rounded transition-colors ${
              guidesConfig.showRulers
                ? 'bg-ai-accent text-white shadow-xs'
                : 'text-ai-textMuted hover:bg-ai-hover hover:text-ai-textLight'
            }`}
          >
            <Ruler size={14} />
          </button>
          <button
            onClick={onToggleSmartGuides}
            title={`Умные направляющие (Ctrl+U) [${guidesConfig.smartGuides ? 'Включены' : 'Выключены'}]`}
            className={`p-1.5 rounded transition-colors ${
              guidesConfig.smartGuides
                ? 'bg-ai-accent text-white shadow-xs'
                : 'text-ai-textMuted hover:bg-ai-hover hover:text-ai-textLight'
            }`}
          >
            <Sparkles size={14} />
          </button>
          <button
            onClick={onToggleGuides}
            title={`Направляющие линии (Ctrl+;) [${guidesConfig.showGuides ? 'Включены' : 'Выключены'}]`}
            className={`p-1.5 rounded transition-colors ${
              guidesConfig.showGuides
                ? 'bg-ai-accent text-white shadow-xs'
                : 'text-ai-textMuted hover:bg-ai-hover hover:text-ai-textLight'
            }`}
          >
            <Split size={14} />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-ai-darker px-1.5 py-0.5 rounded border border-ai-border">
          <button
            onClick={() => editor.viewport.zoomOut()}
            title="Уменьшить масштаб"
            className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
          >
            <ZoomOut size={13} />
          </button>
          <span className="font-mono text-[11px] text-ai-textLight min-w-10 text-center">
            {zoomPercent}%
          </span>
          <button
            onClick={() => editor.viewport.zoomIn()}
            title="Увеличить масштаб"
            className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-textLight"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => editor.viewport.fitArtboard()}
            title="Вписать артборд в экран [Ctrl+0]"
            className="p-1 hover:bg-ai-hover rounded text-ai-textMuted hover:text-ai-accent"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={onOpenExportModal}
          className="px-3 py-1.5 bg-ai-accent hover:bg-ai-accentHover text-white rounded font-medium flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Download size={14} />
          <span>Экспорт</span>
        </button>
      </div>
    </header>
  );
};
