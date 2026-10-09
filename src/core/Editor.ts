import paper from 'paper';
import type {
  ActiveStyle,
  ArtboardConfig,
  DirectSelectionInfo,
  LayerNode,
  PathfinderOp,
  SelectionInfo,
  ToolType,
  ViewportState,
} from './types';
import { Viewport } from './Viewport';
import { HistoryManager } from './HistoryManager';
import { SelectionManager } from './SelectionManager';
import type { Tool } from './tools/Tool';
import { SelectTool } from './tools/SelectTool';
import { DirectSelectTool } from './tools/DirectSelectTool';
import { PenTool } from './tools/PenTool';
import { PencilTool } from './tools/PencilTool';
import { EraserTool } from './tools/EraserTool';
import { TextTool } from './tools/TextTool';
import { EyedropperTool } from './tools/EyedropperTool';
import { EllipseTool, LineTool, PolygonTool, RectangleTool, StarTool } from './tools/ShapeTools';
import { GradientTool } from './tools/GradientTool';
import { PanTool, ZoomTool } from './tools/NavTools';
import { Pathfinder } from './operations/Pathfinder';
import { Alignment } from './operations/Alignment';
import { Arrangement } from './operations/Arrangement';
import { Exporter } from './storage/Exporter';
import { Serializer } from './storage/Serializer';
import { LocalStore } from './storage/LocalStore';
import type { GridConfig, GuidesConfig, ManualGuide } from './types';
import { SmartGuidesEngine } from './snapping/SmartGuides';

export interface EditorCallbacks {
  onToolChange?: (tool: ToolType) => void;
  onSelectionChange?: (info: SelectionInfo, directInfo: DirectSelectionInfo) => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onViewportChange?: (viewport: ViewportState) => void;
  onLayersChange?: (layers: LayerNode[]) => void;
  onStyleChange?: (style: ActiveStyle) => void;
  onGridChange?: (grid: GridConfig) => void;
  onGuidesConfigChange?: (config: GuidesConfig) => void;
  onManualGuidesChange?: (guides: ManualGuide[]) => void;
}

export class Editor {
  public readonly scope: paper.PaperScope;
  public readonly viewport: Viewport;
  public readonly history: HistoryManager;
  public readonly selectionManager: SelectionManager;
  public readonly smartGuides: SmartGuidesEngine;

  private canvas: HTMLCanvasElement;
  private artboardLayer: paper.Layer;
  private mainLayer: paper.Layer;
  private overlayLayer: paper.Layer;

  private artboardRect: paper.Path.Rectangle | null = null;
  private artboardShadow: paper.Path.Rectangle | null = null;

  private activeToolType: ToolType = 'select';
  private previousToolType: ToolType = 'select';
  private tools: Map<ToolType, Tool> = new Map();
  private isSpacePanning: boolean = false;

  private gridConfig: GridConfig = {
    showGrid: false,
    snapToGrid: false,
    gridSize: 20,
  };

  private guidesConfig: GuidesConfig = {
    showRulers: true,
    showGuides: true,
    lockGuides: false,
    smartGuides: true,
    snapToGuides: true,
  };

  private manualGuides: ManualGuide[] = [];

  private activeStyle: ActiveStyle = {
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
  };

  private callbacks: EditorCallbacks = {};
  private onWheelHandler: ((e: WheelEvent) => void) | null = null;
  private onKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;
  private onKeyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private hasInitiallyFitted: boolean = false;

  constructor(canvas: HTMLCanvasElement, callbacks?: EditorCallbacks) {
    this.canvas = canvas;
    if (callbacks) {
      this.callbacks = callbacks;
    }

    this.scope = new paper.PaperScope();
    this.scope.setup(canvas);

    // Create 3 isolated layers: artboard background, main content, interactive overlay
    this.artboardLayer = new this.scope.Layer();
    this.artboardLayer.name = 'artboard';

    this.mainLayer = new this.scope.Layer();
    this.mainLayer.name = 'main';

    this.overlayLayer = new this.scope.Layer();
    this.overlayLayer.name = 'overlay';

    this.mainLayer.activate();

    // Subsystems
    this.viewport = new Viewport(this.scope, (vState) => {
      this.callbacks.onViewportChange?.(vState);
      this.renderOverlay();
    });

    this.history = new HistoryManager(
      () => this.mainLayer,
      () => {
        this.notifyHistoryChange();
        this.notifySelectionChange();
        this.notifyLayersChange();
        this.renderOverlay();
        LocalStore.scheduleAutoSave(this.viewport.getArtboard(), this.mainLayer);
      }
    );

    this.selectionManager = new SelectionManager(this);
    this.smartGuides = new SmartGuidesEngine(this.scope);
    (window as any).__editor = this;

    // Initialize tools
    this.tools.set('select', new SelectTool(this));
    this.tools.set('direct-select', new DirectSelectTool(this));
    this.tools.set('pen', new PenTool(this));
    this.tools.set('pencil', new PencilTool(this));
    this.tools.set('eraser', new EraserTool(this));
    this.tools.set('text', new TextTool(this));
    this.tools.set('eyedropper', new EyedropperTool(this));
    this.tools.set('rectangle', new RectangleTool(this));
    this.tools.set('ellipse', new EllipseTool(this));
    this.tools.set('polygon', new PolygonTool(this));
    this.tools.set('star', new StarTool(this));
    this.tools.set('line', new LineTool(this));
    this.tools.set('gradient', new GradientTool(this));
    this.tools.set('pan', new PanTool(this));
    this.tools.set('zoom', new ZoomTool(this));

    this.setupPaperToolEvents();
    this.setupDOMEvents();

    this.renderArtboard();
    this.viewport.fitArtboard();

    // Try loading autosave or save initial state
    const restored = LocalStore.loadAutoSave(this.scope, this.mainLayer);
    if (restored) {
      this.viewport.setArtboard(restored.artboard);
      this.renderArtboard();
      this.viewport.fitArtboard();
    }

    this.history.pushState();
    this.setTool('select');
  }

  public getMainLayer(): paper.Layer {
    return this.mainLayer;
  }

  public getOverlayLayer(): paper.Layer {
    return this.overlayLayer;
  }

  public getActiveStyle(): ActiveStyle {
    return { ...this.activeStyle };
  }

  public setActiveStyle(style: Partial<ActiveStyle>): void {
    this.activeStyle = { ...this.activeStyle, ...style };

    // Apply to current selection if any
    if (style.gradient !== undefined) {
      if (style.gradient) {
        this.selectionManager.applyGradient(style.gradient);
      }
    } else if (style.fillColor !== undefined) {
      this.selectionManager.applyFill(style.fillColor);
    }
    if (style.strokeColor !== undefined) {
      this.selectionManager.applyStroke(style.strokeColor);
    }
    if (style.strokeWidth !== undefined) {
      this.selectionManager.applyStrokeWidth(style.strokeWidth);
    }
    if (style.opacity !== undefined) {
      this.selectionManager.applyOpacity(style.opacity);
    }

    this.callbacks.onStyleChange?.(this.activeStyle);
  }

  public swapFillAndStroke(): void {
    const temp = this.activeStyle.fillColor;
    this.setActiveStyle({
      fillColor: this.activeStyle.strokeColor,
      strokeColor: temp,
    });
  }

  public getActiveToolType(): ToolType {
    return this.activeToolType;
  }

  public setTool(type: ToolType): void {
    const current = this.tools.get(this.activeToolType);
    if (current) {
      current.deactivate();
    }

    this.activeToolType = type;
    const next = this.tools.get(type);
    if (next) {
      next.activate();
      this.canvas.style.cursor = next.cursor;
    }

    this.callbacks.onToolChange?.(type);
    this.renderOverlay();
  }

  public setArtboardConfig(config: Partial<ArtboardConfig>): void {
    this.viewport.setArtboard(config);
    this.renderArtboard();
    LocalStore.scheduleAutoSave(this.viewport.getArtboard(), this.mainLayer);
  }

  public getGridConfig(): GridConfig {
    return { ...this.gridConfig };
  }

  public setGridConfig(config: Partial<GridConfig>): void {
    this.gridConfig = { ...this.gridConfig, ...config };
    this.renderArtboard();
    this.callbacks.onGridChange?.(this.gridConfig);
  }

  public toggleGrid(): void {
    this.setGridConfig({ showGrid: !this.gridConfig.showGrid });
  }

  public toggleSnapToGrid(): void {
    this.setGridConfig({ snapToGrid: !this.gridConfig.snapToGrid });
  }

  public snapPoint(point: paper.Point): paper.Point {
    if (!this.gridConfig.snapToGrid) return point;
    const size = this.gridConfig.gridSize;
    return new this.scope.Point(
      Math.round(point.x / size) * size,
      Math.round(point.y / size) * size
    );
  }

  public getGuidesConfig(): GuidesConfig {
    return { ...this.guidesConfig };
  }

  public setGuidesConfig(config: Partial<GuidesConfig>): void {
    this.guidesConfig = { ...this.guidesConfig, ...config };
    this.renderOverlay();
    this.callbacks.onGuidesConfigChange?.(this.guidesConfig);
  }

  public toggleRulers(): void {
    this.setGuidesConfig({ showRulers: !this.guidesConfig.showRulers });
  }

  public toggleGuides(): void {
    this.setGuidesConfig({ showGuides: !this.guidesConfig.showGuides });
  }

  public toggleSmartGuides(): void {
    this.setGuidesConfig({ smartGuides: !this.guidesConfig.smartGuides });
  }

  public toggleLockGuides(): void {
    this.setGuidesConfig({ lockGuides: !this.guidesConfig.lockGuides });
  }

  public getManualGuides(): ManualGuide[] {
    return [...this.manualGuides];
  }

  public addManualGuide(orientation: 'horizontal' | 'vertical', coord: number): ManualGuide {
    const guide: ManualGuide = {
      id: `guide-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orientation,
      coord,
    };
    this.manualGuides.push(guide);
    this.renderOverlay();
    this.callbacks.onManualGuidesChange?.(this.manualGuides);
    return guide;
  }

  public removeManualGuide(id: string): void {
    this.manualGuides = this.manualGuides.filter((g) => g.id !== id);
    this.renderOverlay();
    this.callbacks.onManualGuidesChange?.(this.manualGuides);
  }

  public clearManualGuides(): void {
    this.manualGuides = [];
    this.renderOverlay();
    this.callbacks.onManualGuidesChange?.(this.manualGuides);
  }

  public renderArtboard(): void {
    this.artboardLayer.activate();
    this.artboardLayer.removeChildren();

    const bounds = this.viewport.getArtboardBounds();
    const config = this.viewport.getArtboard();

    // Subtle drop shadow behind artboard
    this.artboardShadow = new this.scope.Path.Rectangle({
      point: [bounds.x + 4, bounds.y + 4],
      size: [bounds.width, bounds.height],
      fillColor: new this.scope.Color(0, 0, 0, 0.35),
    });

    // Artboard canvas background
    this.artboardRect = new this.scope.Path.Rectangle({
      rectangle: bounds,
      fillColor: new this.scope.Color(config.backgroundColor || '#ffffff'),
      strokeColor: new this.scope.Color(0.2, 0.2, 0.2, 0.8),
      strokeWidth: 1,
    });

    // Grid rendering (crisp grid lines aligned with artboard)
    if (this.gridConfig.showGrid) {
      const step = this.gridConfig.gridSize;
      const gridGroup = new this.scope.Group();
      gridGroup.name = 'grid-guides';

      // Vertical lines
      for (let x = bounds.left; x <= bounds.right; x += step) {
        const line = new this.scope.Path.Line({
          from: [x, bounds.top],
          to: [x, bounds.bottom],
          strokeColor: new this.scope.Color(0, 0, 0, 0.08),
          strokeWidth: 1,
        });
        gridGroup.addChild(line);
      }

      // Horizontal lines
      for (let y = bounds.top; y <= bounds.bottom; y += step) {
        const line = new this.scope.Path.Line({
          from: [bounds.left, y],
          to: [bounds.right, y],
          strokeColor: new this.scope.Color(0, 0, 0, 0.08),
          strokeWidth: 1,
        });
        gridGroup.addChild(line);
      }
    }

    this.mainLayer.activate();
  }

  public renderOverlay(): void {
    this.overlayLayer.activate();
    // Keep user's active tools temporary items (rubberband, marquee) if present, but clear bounding boxes & manual guide lines
    const helpers = this.overlayLayer.children.filter(
      (c) => c.data?.isTransformOverlay || c.data?.isManualGuideLine
    );
    helpers.forEach((h) => h.remove());

    const zoom = this.viewport.getZoom();

    // Render manual guide lines (Cyan #00c0ff, 1 / zoom px)
    if (this.guidesConfig.showGuides && this.manualGuides.length > 0) {
      const artboardBounds = this.viewport.getArtboardBounds();
      const cyanColor = new this.scope.Color('#00c0ff');
      const strokeWidth = 1 / zoom;

      this.manualGuides.forEach((g) => {
        let line: paper.Path.Line;
        if (g.orientation === 'vertical') {
          line = new this.scope.Path.Line({
            from: new this.scope.Point(g.coord, artboardBounds.top - 10000),
            to: new this.scope.Point(g.coord, artboardBounds.bottom + 10000),
            strokeColor: cyanColor,
            strokeWidth,
            dashArray: [4 / zoom, 2 / zoom],
            insert: false,
          });
        } else {
          line = new this.scope.Path.Line({
            from: new this.scope.Point(artboardBounds.left - 10000, g.coord),
            to: new this.scope.Point(artboardBounds.right + 10000, g.coord),
            strokeColor: cyanColor,
            strokeWidth,
            dashArray: [4 / zoom, 2 / zoom],
            insert: false,
          });
        }
        line.data = { isManualGuideLine: true, guideId: g.id };
        this.overlayLayer.addChild(line);
      });
    }

    if (this.activeToolType === 'select') {
      const selected = this.selectionManager.getSelectedItems();
      if (selected.length > 0) {
        let bounds = selected[0].bounds.clone();
        for (let i = 1; i < selected.length; i++) {
          bounds = bounds.unite(selected[i].bounds);
        }

        const zoom = this.viewport.getZoom();
        const handleSize = 7 / zoom;
        const halfSize = handleSize / 2;

        // Bounding box frame
        const frame = new this.scope.Path.Rectangle({
          rectangle: bounds,
          strokeColor: new this.scope.Color('#0d99ff'),
          strokeWidth: 1 / zoom,
          fillColor: null as any,
          data: { isTransformOverlay: true },
        });

        // Rotation stem and handle
        const rotPos = new this.scope.Point(bounds.center.x, bounds.top - 20 / zoom);
        const rotStem = new this.scope.Path.Line({
          from: new this.scope.Point(bounds.center.x, bounds.top),
          to: rotPos,
          strokeColor: new this.scope.Color('#0d99ff'),
          strokeWidth: 1 / zoom,
          data: { isTransformOverlay: true },
        });

        const rotHandle = new this.scope.Path.Circle({
          center: rotPos,
          radius: 4 / zoom,
          strokeColor: new this.scope.Color('#0d99ff'),
          strokeWidth: 1.5 / zoom,
          fillColor: new this.scope.Color('#ffffff'),
          data: { isTransformOverlay: true },
        });

        // 8 resize handles
        const handlePositions = [
          bounds.topLeft,
          new this.scope.Point(bounds.center.x, bounds.top),
          bounds.topRight,
          new this.scope.Point(bounds.right, bounds.center.y),
          bounds.bottomRight,
          new this.scope.Point(bounds.center.x, bounds.bottom),
          bounds.bottomLeft,
          new this.scope.Point(bounds.left, bounds.center.y),
        ];

        handlePositions.forEach((pos) => {
          new this.scope.Path.Rectangle({
            point: [pos.x - halfSize, pos.y - halfSize],
            size: [handleSize, handleSize],
            fillColor: new this.scope.Color('#ffffff'),
            strokeColor: new this.scope.Color('#0d99ff'),
            strokeWidth: 1 / zoom,
            data: { isTransformOverlay: true },
          });
        });
      }
    }

    this.mainLayer.activate();
  }

  // Pathfinder operations
  public pathfinder(op: PathfinderOp): void {
    const selected = this.selectionManager.getSelectedItems();
    if (selected.length < 2) return;

    const result = Pathfinder.execute(selected, op);
    if (result) {
      this.selectionManager.updateSelection();
      this.history.pushState();
    }
  }

  // Alignment operations
  public align(type: any, mode: any = 'selection'): void {
    const selected = this.selectionManager.getSelectedItems();
    if (selected.length === 0) return;

    Alignment.execute(selected, type, mode, this.viewport.getArtboardBounds());
    this.selectionManager.updateSelection();
    this.history.pushState();
  }

  // Arrangement operations
  public bringToFront(): void {
    Arrangement.bringToFront(this.selectionManager.getSelectedItems());
    this.history.pushState();
  }

  public sendToBack(): void {
    Arrangement.sendToBack(this.selectionManager.getSelectedItems());
    this.history.pushState();
  }

  public bringForward(): void {
    Arrangement.bringForward(this.selectionManager.getSelectedItems());
    this.history.pushState();
  }

  public sendBackward(): void {
    Arrangement.sendBackward(this.selectionManager.getSelectedItems());
    this.history.pushState();
  }

  public group(): void {
    const group = Arrangement.group(this.selectionManager.getSelectedItems());
    if (group) {
      this.selectionManager.updateSelection();
      this.history.pushState();
    }
  }

  public ungroup(): void {
    const selected = this.selectionManager.getSelectedItems();
    const groups = selected.filter((s) => s instanceof paper.Group) as paper.Group[];
    if (groups.length > 0) {
      Arrangement.ungroup(groups);
      this.selectionManager.updateSelection();
      this.history.pushState();
    }
  }

  // Notifications
  public notifySelectionChange(): void {
    const info = this.selectionManager.getSelectionInfo();
    const directInfo = this.selectionManager.getDirectSelectionInfo();

    if (info.fillColor || info.strokeColor) {
      this.activeStyle = {
        ...this.activeStyle,
        fillColor: info.fillColor !== null ? info.fillColor : this.activeStyle.fillColor,
        strokeColor: info.strokeColor !== null ? info.strokeColor : this.activeStyle.strokeColor,
        strokeWidth: info.strokeWidth !== null ? info.strokeWidth : this.activeStyle.strokeWidth,
        opacity: info.opacity !== null ? info.opacity : this.activeStyle.opacity,
      };
      this.callbacks.onStyleChange?.(this.activeStyle);
    }

    this.callbacks.onSelectionChange?.(info, directInfo);
    this.notifyLayersChange();
    this.renderOverlay();
  }

  public notifyHistoryChange(): void {
    this.callbacks.onHistoryChange?.(this.history.canUndo(), this.history.canRedo());
  }

  public notifyLayersChange(): void {
    const layers = this.getLayerTree();
    this.callbacks.onLayersChange?.(layers);
  }

  public getLayerTree(): LayerNode[] {
    const buildNode = (item: paper.Item): LayerNode => {
      let type: LayerNode['type'] = 'path';
      if (item instanceof paper.CompoundPath) type = 'compound-path';
      else if (item instanceof paper.Group) type = 'group';
      else if (item instanceof paper.PointText) type = 'text';
      else if (item instanceof paper.Path.Rectangle || item instanceof paper.Path.Ellipse) type = 'shape';

      const node: LayerNode = {
        id: item.id,
        name: item.name || `${type} #${item.id}`,
        type,
        visible: item.visible,
        locked: item.locked,
        selected: item.selected,
      };

      if (item instanceof paper.Group && item.children) {
        node.children = item.children.map(buildNode);
      }
      return node;
    };

    return this.mainLayer.children.map(buildNode);
  }

  public setItemVisibility(id: number, visible: boolean): void {
    const item = this.mainLayer.getItem({ id });
    if (item) {
      item.visible = visible;
      this.notifyLayersChange();
      this.renderOverlay();
    }
  }

  public setItemLock(id: number, locked: boolean): void {
    const item = this.mainLayer.getItem({ id });
    if (item) {
      item.locked = locked;
      this.notifyLayersChange();
    }
  }

  public selectItemById(id: number): void {
    const item = this.mainLayer.getItem({ id });
    if (item) {
      this.selectionManager.selectItem(item);
    }
  }

  // Export & File methods
  public exportSVG(): string {
    return Exporter.exportSVG(this.scope, this.viewport.getArtboard());
  }

  public async exportPNG(scale: number = 1): Promise<string> {
    return Exporter.exportPNG(this.scope, this.viewport.getArtboard(), scale);
  }

  public async saveProjectFile(): Promise<void> {
    const json = Serializer.serialize(this.viewport.getArtboard(), this.mainLayer);
    const fileName = `${this.viewport.getArtboard().name}.ai.json`;
    if (window.electronAPI?.isElectron) {
      await window.electronAPI.saveFileDialog({
        content: json,
        defaultName: fileName,
        extension: 'ai.json',
      });
      return;
    }
    Exporter.downloadFile(json, fileName, 'application/json');
  }

  public async openProjectFile(): Promise<void> {
    if (window.electronAPI?.isElectron) {
      const result = await window.electronAPI.openFileDialog();
      if (result?.content) {
        if (result.fileName.toLowerCase().endsWith('.svg')) {
          this.importSVGString(result.content);
        } else {
          this.loadProjectFile(result.content);
        }
      }
    }
  }

  public loadProjectFile(jsonString: string): void {
    const restored = Serializer.deserialize(jsonString, this.scope, this.mainLayer);
    this.viewport.setArtboard(restored.artboard);
    this.renderArtboard();
    this.viewport.fitArtboard();
    this.history.clear();
    this.history.pushState();
  }

  public importSVGString(svgString: string): void {
    const item = Serializer.importSVG(svgString, this.scope, this.mainLayer);
    if (item) {
      this.selectionManager.updateSelection();
      this.history.pushState();
    }
  }

  private setupPaperToolEvents(): void {
    const paperTool = new this.scope.Tool();

    paperTool.onMouseDown = (event: paper.ToolEvent) => {
      const tool = this.tools.get(this.activeToolType);
      tool?.onMouseDown(event);
    };

    paperTool.onMouseDrag = (event: paper.ToolEvent) => {
      const tool = this.tools.get(this.activeToolType);
      tool?.onMouseDrag(event);
    };

    paperTool.onMouseUp = (event: paper.ToolEvent) => {
      const tool = this.tools.get(this.activeToolType);
      tool?.onMouseUp(event);
    };

    paperTool.onMouseMove = (event: paper.ToolEvent) => {
      const tool = this.tools.get(this.activeToolType);
      tool?.onMouseMove(event);
    };

    paperTool.onKeyDown = (event: paper.KeyEvent) => {
      const tool = this.tools.get(this.activeToolType);
      tool?.onKeyDown(event);
    };

    paperTool.onKeyUp = (event: paper.KeyEvent) => {
      const tool = this.tools.get(this.activeToolType);
      tool?.onKeyUp(event);
    };
  }

  private setupDOMEvents(): void {
    // Wheel zoom & pan
    this.onWheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mousePoint = new this.scope.Point(e.clientX - rect.left, e.clientY - rect.top);
      const projectPoint = this.viewport.screenToProject(mousePoint);

      if (e.ctrlKey || e.metaKey) {
        // Pinch or Ctrl + wheel = zoom
        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        this.viewport.setZoom(this.viewport.getZoom() * factor, projectPoint);
      } else {
        // Regular wheel = pan (screen delta)
        const delta = new this.scope.Point(e.deltaX, e.deltaY);
        this.viewport.pan(delta.multiply(-1), true);
      }
    };
    this.canvas.addEventListener('wheel', this.onWheelHandler, { passive: false });

    // Global keyboard shortcuts (Illustrator layout)
    this.onKeyDownHandler = (e: KeyboardEvent) => {
      // Don't intercept when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      // Space bar: temporary PanTool
      if (e.code === 'Space' && !this.isSpacePanning) {
        this.isSpacePanning = true;
        this.previousToolType = this.activeToolType;
        this.setTool('pan');
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          this.history.redo();
        } else {
          this.history.undo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        this.history.redo();
        return;
      }

      // Fit to screen (Ctrl+0)
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        this.viewport.fitArtboard();
        return;
      }

      // Toggle grid (Ctrl+')
      if ((e.ctrlKey || e.metaKey) && (e.key === '\'' || e.key === '\"')) {
        e.preventDefault();
        this.toggleGrid();
        return;
      }

      // Toggle Smart Guides (Ctrl+U)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        this.toggleSmartGuides();
        return;
      }

      // Toggle Rulers (Ctrl+R)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        this.toggleRulers();
        return;
      }

      // Toggle Guides (Ctrl+;)
      if ((e.ctrlKey || e.metaKey) && (e.key === ';' || e.key === 'ж' || e.key === 'Ж')) {
        e.preventDefault();
        if (e.altKey) {
          this.toggleLockGuides();
        } else {
          this.toggleGuides();
        }
        return;
      }

      // Group (Ctrl+G), Ungroup (Ctrl+Shift+G)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (e.shiftKey) {
          this.ungroup();
        } else {
          this.group();
        }
        return;
      }

      // Layer ordering (Ctrl+[, Ctrl+], Ctrl+Shift+[, Ctrl+Shift+])
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        if (e.shiftKey) {
          this.sendToBack();
        } else {
          this.sendBackward();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        if (e.shiftKey) {
          this.bringToFront();
        } else {
          this.bringForward();
        }
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.selectionManager.deleteSelected();
        return;
      }

      // Swap fill and stroke (X)
      if (e.key === 'x' || e.key === 'X') {
        this.swapFillAndStroke();
        return;
      }

      // Shift+E: Eraser Tool (Illustrator shortcut)
      if (e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        this.setTool('eraser');
        return;
      }

      // Tool shortcuts (Illustrator single keys)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            this.setTool('select');
            break;
          case 'a':
            this.setTool('direct-select');
            break;
          case 'p':
            this.setTool('pen');
            break;
          case 'n':
            this.setTool('pencil');
            break;
          case 'e':
            this.setTool('eraser');
            break;
          case 't':
            this.setTool('text');
            break;
          case 'i':
            this.setTool('eyedropper');
            break;
          case 'm':
            this.setTool('rectangle');
            break;
          case 'l':
            this.setTool('ellipse');
            break;
          case '\\':
            this.setTool('line');
            break;
          case 'g':
            this.setTool('gradient');
            break;
          case 'h':
            this.setTool('pan');
            break;
          case 'z':
            this.setTool('zoom');
            break;
        }
      }
    };
    if (this.onKeyDownHandler) {
      window.addEventListener('keydown', this.onKeyDownHandler);
    }

    this.onKeyUpHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && this.isSpacePanning) {
        this.isSpacePanning = false;
        this.setTool(this.previousToolType);
      }
    };
    window.addEventListener('keyup', this.onKeyUpHandler);
  }

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;

    this.scope.view.viewSize = new this.scope.Size(width, height);
    this.renderArtboard();
    this.renderOverlay();

    if (!this.hasInitiallyFitted && width > 100 && height > 100) {
      this.hasInitiallyFitted = true;
      this.viewport.fitArtboard();
    }
  }

  public destroy(): void {
    if (this.onWheelHandler) {
      this.canvas.removeEventListener('wheel', this.onWheelHandler);
      this.onWheelHandler = null;
    }
    if (this.onKeyDownHandler) {
      window.removeEventListener('keydown', this.onKeyDownHandler);
      this.onKeyDownHandler = null;
    }
    if (this.onKeyUpHandler) {
      window.removeEventListener('keyup', this.onKeyUpHandler);
      this.onKeyUpHandler = null;
    }

    this.tools.forEach((tool) => tool.deactivate());
    this.tools.clear();

    try {
      this.scope.project?.clear();
      this.scope.project?.remove();
    } catch {
      // ignore
    }
  }
}
