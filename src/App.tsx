import { useRef, useState } from 'react';
import { useEditor } from './hooks/useEditor';
import { TopControlBar } from './components/controlbar/TopControlBar';
import { LeftToolbar } from './components/toolbar/LeftToolbar';
import { CanvasView } from './components/canvas/CanvasView';
import { RightSidebar } from './components/panels/RightSidebar';
import { ColorPickerModal } from './components/dialogs/ColorPickerModal';
import { ExportModal } from './components/dialogs/ExportModal';

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
    setTool,
    updateStyle,
    swapColors,
    updateArtboard,
  } = useEditor(canvasRef);

  // Modals state
  const [colorPickerTarget, setColorPickerTarget] = useState<'fill' | 'stroke' | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleOpenColorPicker = (type: 'fill' | 'stroke') => {
    setColorPickerTarget(type);
  };

  const handleSelectColor = (color: string | null) => {
    if (colorPickerTarget === 'fill') {
      updateStyle({ fillColor: color });
    } else if (colorPickerTarget === 'stroke') {
      updateStyle({ strokeColor: color });
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
        selection={selection}
        activeStyle={activeStyle}
        historyState={historyState}
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
          canvasRef={canvasRef}
          activeTool={activeTool}
          viewport={viewport}
          artboard={artboard}
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
        onSelectColor={handleSelectColor}
        title={colorPickerTarget === 'fill' ? 'Выбор цвета заливки (Fill)' : 'Выбор цвета обводки (Stroke)'}
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
