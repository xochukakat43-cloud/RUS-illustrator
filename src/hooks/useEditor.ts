import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '../core/Editor';
import type {
  ActiveStyle,
  ArtboardConfig,
  DirectSelectionInfo,
  GridConfig,
  LayerNode,
  SelectionInfo,
  ToolType,
  ViewportState,
} from '../core/types';

export function useEditor(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const editorRef = useRef<Editor | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeStyle, setActiveStyle] = useState<ActiveStyle>({
    fillColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 2,
    strokeCap: 'round',
    strokeJoin: 'round',
    dashArray: [],
    opacity: 1,
    fontFamily: 'Inter, sans-serif',
    fontSize: 36,
    fontWeight: 'normal',
    fontStyle: 'normal',
  });
  const [selection, setSelection] = useState<SelectionInfo>({
    count: 0,
    bounds: null,
    fillColor: null,
    strokeColor: null,
    strokeWidth: null,
    dashArray: null,
    opacity: null,
    isPath: false,
    isGroup: false,
    isText: false,
  });
  const [directSelection, setDirectSelection] = useState<DirectSelectionInfo>({
    selectedSegmentCount: 0,
    isSmooth: null,
  });
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: 1,
    panX: 600,
    panY: 400,
  });
  const [gridConfig, setGridConfigState] = useState<GridConfig>({
    showGrid: false,
    snapToGrid: false,
    gridSize: 20,
  });
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });
  const [layers, setLayers] = useState<LayerNode[]>([]);
  const [artboard, setArtboard] = useState<ArtboardConfig>({
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    name: 'Artboard 1',
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const editor = new Editor(canvasRef.current, {
      onToolChange: (tool) => setActiveTool(tool),
      onStyleChange: (style) => setActiveStyle(style),
      onSelectionChange: (info, directInfo) => {
        setSelection(info);
        setDirectSelection(directInfo);
      },
      onHistoryChange: (canUndo, canRedo) => setHistoryState({ canUndo, canRedo }),
      onViewportChange: (vp) => setViewport(vp),
      onLayersChange: (tree) => setLayers(tree),
      onGridChange: (grid) => setGridConfigState(grid),
    });

    editorRef.current = editor;
    setArtboard(editor.viewport.getArtboard());
    setGridConfigState(editor.getGridConfig());
    setIsReady(true);

    const handleResize = () => {
      if (canvasRef.current && editorRef.current) {
        editorRef.current.resize(
          canvasRef.current.clientWidth,
          canvasRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      editor.destroy();
    };
  }, [canvasRef]);

  const setTool = useCallback((tool: ToolType) => {
    editorRef.current?.setTool(tool);
  }, []);

  const updateStyle = useCallback((style: Partial<ActiveStyle>) => {
    editorRef.current?.setActiveStyle(style);
  }, []);

  const swapColors = useCallback(() => {
    editorRef.current?.swapFillAndStroke();
  }, []);

  const updateArtboard = useCallback((config: Partial<ArtboardConfig>) => {
    editorRef.current?.setArtboardConfig(config);
    if (editorRef.current) {
      setArtboard(editorRef.current.viewport.getArtboard());
    }
  }, []);

  const toggleGrid = useCallback(() => {
    editorRef.current?.toggleGrid();
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    editorRef.current?.toggleSnapToGrid();
  }, []);

  const setGridConfig = useCallback((config: Partial<GridConfig>) => {
    editorRef.current?.setGridConfig(config);
  }, []);

  return {
    editor: editorRef.current,
    isReady,
    activeTool,
    activeStyle,
    selection,
    directSelection,
    viewport,
    gridConfig,
    historyState,
    layers,
    artboard,
    setTool,
    updateStyle,
    swapColors,
    updateArtboard,
    toggleGrid,
    toggleSnapToGrid,
    setGridConfig,
  };
}
