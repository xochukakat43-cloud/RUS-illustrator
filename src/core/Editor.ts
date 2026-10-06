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
import { EllipseTool, LineTool, RectangleTool } from './tools/ShapeTools';
import { PanTool, ZoomTool } from './tools/NavTools';
import { Pathfinder } from './operations/Pathfinder';
import { Alignment } from './operations/Alignment';
import { Arrangement } from './operations/Arrangement';
import { Exporter } from './storage/Exporter';
import { Serializer } from './storage/Serializer';
import { LocalStore } from './storage/LocalStore';

export interface EditorCallbacks {
  onToolChange?: (tool: ToolType) => void;
  onSelectionChange?: (info: SelectionInfo, directInfo: DirectSelectionInfo) => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onViewportChange?: (viewport: ViewportState) => void;
  onLayersChange?: (layers: LayerNode[]) => void;
  onStyleChange?: (style: ActiveStyle) => void;
}

export class Editor {
  public readonly scope: paper.PaperScope;
  public readonly viewport: Viewport;
  public readonly history: HistoryManager;
  public readonly selectionManager: SelectionManager;

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

  private activeStyle: ActiveStyle = {
    fillColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 2,
    strokeCap: 'round',
    strokeJoin: 'round',
    opacity: 1,
  };

  private callbacks: EditorCallbacks = {};

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

    // Initialize tools
    this.tools.set('select', new SelectTool(this));
    this.tools.set('direct-select', new DirectSelectTool(this));
    this.tools.set('pen', new PenTool(this));
    this.tools.set('rectangle', new RectangleTool(this));
    this.tools.set('ellipse', new EllipseTool(this));
    this.tools.set('line', new LineTool(this));
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
    if (style.fillColor !== undefined) {
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

    this.mainLayer.activate();
  }

  public renderOverlay(): void {
    this.overlayLayer.activate();
    // Keep user's active tools temporary items (rubberband, marquee) if present, but clear bounding boxes
    const helpers = this.overlayLayer.children.filter((c) => c.data?.isTransformOverlay);
    helpers.forEach((h) => h.remove());

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

  public saveProjectFile(): void {
    const json = Serializer.serialize(this.viewport.getArtboard(), this.mainLayer);
    Exporter.downloadFile(json, `${this.viewport.getArtboard().name}.ai.json`, 'application/json');
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
    this.canvas.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mousePoint = new this.scope.Point(e.clientX - rect.left, e.clientY - rect.top);
        const projectPoint = this.viewport.screenToProject(mousePoint);

        if (e.ctrlKey || e.metaKey) {
          // Pinch or Ctrl + wheel = zoom
          const factor = e.deltaY < 0 ? 1.15 : 0.85;
          this.viewport.setZoom(this.viewport.getZoom() * factor, projectPoint);
        } else {
          // Regular wheel = pan
          const delta = new this.scope.Point(e.deltaX, e.deltaY);
          this.viewport.pan(delta.multiply(-1));
        }
      },
      { passive: false }
    );

    // Global keyboard shortcuts (Illustrator layout)
    window.addEventListener('keydown', (e: KeyboardEvent) => {
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
          case 'm':
            this.setTool('rectangle');
            break;
          case 'l':
            this.setTool('ellipse');
            break;
          case '\\':
            this.setTool('line');
            break;
          case 'h':
            this.setTool('pan');
            break;
          case 'z':
            this.setTool('zoom');
            break;
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.code === 'Space' && this.isSpacePanning) {
        this.isSpacePanning = false;
        this.setTool(this.previousToolType);
      }
    });
  }

  public resize(width: number, height: number): void {
    this.scope.view.viewSize = new this.scope.Size(width, height);
    this.renderArtboard();
    this.renderOverlay();
  }

  public destroy(): void {
    // Cleanup if needed
  }
}
