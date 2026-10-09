import { useRef, useState, useEffect } from 'react';
import { useEditor } from './hooks/useEditor';
import { TopControlBar } from './components/controlbar/TopControlBar';
import { LeftToolbar } from './components/toolbar/LeftToolbar';
import { CanvasView } from './components/canvas/CanvasView';
import { RightSidebar } from './components/panels/RightSidebar';
import { ColorPickerModal } from './components/dialogs/ColorPickerModal';
import { ExportModal } from './components/dialogs/ExportModal';

import type { GradientDef } from './core/types';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    editor,
    activeTool,
    activeStyle,
    selection,
    directSelection,
    viewport,
    historyState,
    layers,
    artboard,
    gridConfig,
    guidesConfig,
    setTool,
    updateStyle,
    swapColors,
    updateArtboard,
    toggleGrid,
    toggleSnapToGrid,
    toggleRulers,
    toggleGuides,
    toggleSmartGuides,
  } = useEditor(canvasRef);

  // Modals state
  const [colorPickerTarget, setColorPickerTarget] = useState<'fill' | 'stroke' | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Listen to Electron native application menu actions
  useEffect(() => {
    if (!window.electronAPI?.onMenuAction || !editor) return;

    const unsubscribe = window.electronAPI.onMenuAction((action) => {
      switch (action) {
        case 'new':
          if (window.confirm('Создать новый документ? Все несохраненные изменения будут сброшены.')) {
            editor.getMainLayer().removeChildren();
            editor.history.clear();
            editor.history.pushState();
          }
          break;
        case 'open':
          editor.openProjectFile();
          break;
        case 'save':
          editor.saveProjectFile();
          break;
        case 'export':
          setIsExportModalOpen(true);
          break;
        case 'undo':
          editor.history.undo();
          break;
        case 'redo':
          editor.history.redo();
          break;
        case 'toggle-rulers':
          toggleRulers();
          break;
        case 'toggle-smart-guides':
          toggleSmartGuides();
          break;
        case 'toggle-guides':
          toggleGuides();
          break;
        case 'toggle-grid':
          toggleGrid();
          break;
        case 'fit-artboard':
          editor.viewport.fitArtboard();
          break;
        case 'zoom-in':
          editor.viewport.zoomIn();
          break;
        case 'zoom-out':
          editor.viewport.zoomOut();
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [editor, toggleRulers, toggleSmartGuides, toggleGuides, toggleGrid]);

  const handleOpenColorPicker = (type: 'fill' | 'stroke') => {
    setColorPickerTarget(type);
  };

  const handleSelectColor = (color: string | null) => {
    if (colorPickerTarget === 'fill') {
      updateStyle({ fillColor: color, gradient: null });
    } else if (colorPickerTarget === 'stroke') {
      updateStyle({ strokeColor: color });
    }
  };

  const handleSelectGradient = (gradient: GradientDef) => {
    if (colorPickerTarget === 'fill') {
      updateStyle({ gradient, fillColor: null });
    }
  };

  const handleResetColors = () => {
    updateStyle({
      fillColor: '#ffffff',
      strokeColor: '#000000',
    });
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-ai-darkest text-ai-textLight font-sans">
      {/* Top Illustrator Control Bar */}
      <TopControlBar
        editor={editor}
        viewport={viewport}
        gridConfig={gridConfig}
        guidesConfig={guidesConfig}
        selection={selection}
        activeStyle={activeStyle}
        historyState={historyState}
        onToggleGrid={toggleGrid}
        onToggleSnapToGrid={toggleSnapToGrid}
        onToggleRulers={toggleRulers}
        onToggleGuides={toggleGuides}
        onToggleSmartGuides={toggleSmartGuides}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenColorPicker={handleOpenColorPicker}
      />

      {/* Main Workspace: Left Toolbar + Canvas + Right Sidebar Dock */}
      <div className="flex flex-1 overflow-hidden relative">
        <LeftToolbar
          activeTool={activeTool}
          onSelectTool={setTool}
          activeStyle={activeStyle}
          onOpenColorPicker={handleOpenColorPicker}
          onSwapColors={swapColors}
          onResetColors={handleResetColors}
        />

        <CanvasView
          editor={editor}
          canvasRef={canvasRef}
          activeTool={activeTool}
          viewport={viewport}
          artboard={artboard}
          guidesConfig={guidesConfig}
        />

        <RightSidebar
          editor={editor}
          selection={selection}
          directSelection={directSelection}
          activeStyle={activeStyle}
          layers={layers}
          artboard={artboard}
          onUpdateArtboard={updateArtboard}
          onOpenColorPicker={handleOpenColorPicker}
        />
      </div>

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={colorPickerTarget !== null}
        onClose={() => setColorPickerTarget(null)}
        currentColor={colorPickerTarget === 'fill' ? activeStyle.fillColor : activeStyle.strokeColor}
        currentGradient={colorPickerTarget === 'fill' ? activeStyle.gradient : null}
        onSelectColor={handleSelectColor}
        onSelectGradient={handleSelectGradient}
        title={colorPickerTarget === 'fill' ? 'Выбор цвета заливки (Fill)' : 'Выбор цвета обводки (Stroke)'}
        allowGradient={colorPickerTarget === 'fill'}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        editor={editor}
      />
    </div>
  );
}

export default App;
