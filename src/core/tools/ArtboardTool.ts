import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType, ArtboardConfig } from '../types';
import type { Editor } from '../Editor';

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface HandleInfo {
  type: HandleType;
  point: paper.Point;
}

export class ArtboardTool extends Tool {
  public readonly type: ToolType = 'artboard';
  public readonly cursor: string = 'default';

  private isDragging: boolean = false;
  private dragMode: 'move' | 'resize' | 'create' | null = null;
  private activeHandle: HandleType | null = null;
  private startPoint: paper.Point | null = null;
  private initialArtboardRect: paper.Rectangle | null = null;
  private createRect: paper.Path.Rectangle | null = null;

  constructor(editor: Editor) {
    super(editor);
  }

  public override activate(): void {
    super.activate();
    this.renderArtboardOverlays();
  }

  public override deactivate(): void {
    super.deactivate();
    this.clearArtboardOverlays();
    this.editor.canvas.style.cursor = 'default';
  }

  public override onMouseMove(event: paper.ToolEvent): void {
    if (this.isDragging) return;

    const handle = this.hitTestHandles(event.point);
    if (handle) {
      this.editor.canvas.style.cursor = this.getCursorForHandle(handle.type);
      return;
    }

    const artboards = this.editor.viewport.getArtboards();
    const hitArtboard = artboards.some((ab: ArtboardConfig) => {
      const rect = new this.editor.scope.Rectangle(ab.x ?? 0, ab.y ?? 0, ab.width, ab.height);
      return rect.contains(event.point);
    });

    if (hitArtboard) {
      this.editor.canvas.style.cursor = 'move';
    } else {
      this.editor.canvas.style.cursor = 'crosshair';
    }
  }

  public override onMouseDown(event: paper.ToolEvent): void {
    this.startPoint = event.point;
    this.isDragging = true;

    // 1. Check if hit active artboard handles
    const handle = this.hitTestHandles(event.point);
    if (handle) {
      this.dragMode = 'resize';
      this.activeHandle = handle.type;
      const activeAb = this.editor.viewport.getArtboard();
      this.initialArtboardRect = new this.editor.scope.Rectangle(
        activeAb.x ?? 0,
        activeAb.y ?? 0,
        activeAb.width,
        activeAb.height
      );
      return;
    }

    // 2. Check if clicked inside any artboard
    const artboards = this.editor.viewport.getArtboards();
    let hitIndex = -1;
    for (let i = artboards.length - 1; i >= 0; i--) {
      const ab = artboards[i];
      const rect = new this.editor.scope.Rectangle(ab.x ?? 0, ab.y ?? 0, ab.width, ab.height);
      if (rect.contains(event.point)) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex !== -1) {
      this.editor.viewport.setActiveArtboardIndex(hitIndex);
      this.dragMode = 'move';
      const activeAb = this.editor.viewport.getArtboard();
      this.initialArtboardRect = new this.editor.scope.Rectangle(
        activeAb.x ?? 0,
        activeAb.y ?? 0,
        activeAb.width,
        activeAb.height
      );
      this.renderArtboardOverlays();
      return;
    }

    // 3. Clicked empty canvas -> Create new artboard
    this.dragMode = 'create';
    const zoom = this.editor.viewport.getZoom();
    this.createRect = new this.editor.scope.Path.Rectangle({
      point: event.point,
      size: [1, 1],
      strokeColor: new this.editor.scope.Color('#0080ff'),
      strokeWidth: 1.5 / zoom,
      dashArray: [4 / zoom, 2 / zoom],
      fillColor: new this.editor.scope.Color(0, 0.5, 1, 0.1),
      insert: false,
    });
    this.editor.getOverlayLayer().addChild(this.createRect);
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.isDragging || !this.startPoint) return;

    if (this.dragMode === 'move' && this.initialArtboardRect) {
      const delta = event.point.subtract(this.startPoint);
      const newX = Math.round(this.initialArtboardRect.x + delta.x);
      const newY = Math.round(this.initialArtboardRect.y + delta.y);
      this.editor.viewport.setArtboard({ x: newX, y: newY });
      this.editor.renderArtboard();
      this.renderArtboardOverlays();
    } else if (this.dragMode === 'resize' && this.initialArtboardRect && this.activeHandle) {
      const delta = event.point.subtract(this.startPoint);
      let { x, y, width, height } = this.initialArtboardRect;

      switch (this.activeHandle) {
        case 'e':
          width = Math.max(50, width + delta.x);
          break;
        case 'se':
          width = Math.max(50, width + delta.x);
          height = Math.max(50, height + delta.y);
          break;
        case 's':
          height = Math.max(50, height + delta.y);
          break;
        case 'sw':
          x = x + Math.min(width - 50, delta.x);
          width = Math.max(50, width - delta.x);
          height = Math.max(50, height + delta.y);
          break;
        case 'w':
          x = x + Math.min(width - 50, delta.x);
          width = Math.max(50, width - delta.x);
          break;
        case 'nw':
          x = x + Math.min(width - 50, delta.x);
          width = Math.max(50, width - delta.x);
          y = y + Math.min(height - 50, delta.y);
          height = Math.max(50, height - delta.y);
          break;
        case 'n':
          y = y + Math.min(height - 50, delta.y);
          height = Math.max(50, height - delta.y);
          break;
        case 'ne':
          width = Math.max(50, width + delta.x);
          y = y + Math.min(height - 50, delta.y);
          height = Math.max(50, height - delta.y);
          break;
      }

      this.editor.viewport.setArtboard({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
      this.editor.renderArtboard();
      this.renderArtboardOverlays();
    } else if (this.dragMode === 'create' && this.createRect) {
      const x = Math.min(this.startPoint.x, event.point.x);
      const y = Math.min(this.startPoint.y, event.point.y);
      const w = Math.abs(event.point.x - this.startPoint.x);
      const h = Math.abs(event.point.y - this.startPoint.y);
      this.createRect.bounds = new this.editor.scope.Rectangle(x, y, w, h);
    }
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (!this.isDragging) return;

    if (this.dragMode === 'create' && this.startPoint) {
      const w = Math.abs(event.point.x - this.startPoint.x);
      const h = Math.abs(event.point.y - this.startPoint.y);
      if (w > 60 && h > 60) {
        const x = Math.round(Math.min(this.startPoint.x, event.point.x));
        const y = Math.round(Math.min(this.startPoint.y, event.point.y));
        this.editor.viewport.addArtboard({
          x,
          y,
          width: Math.round(w),
          height: Math.round(h),
        });
        this.editor.renderArtboard();
        this.editor.history.pushState();
      }
      if (this.createRect) {
        this.createRect.remove();
        this.createRect = null;
      }
    } else if (this.dragMode === 'move' || this.dragMode === 'resize') {
      this.editor.history.pushState();
    }

    this.isDragging = false;
    this.dragMode = null;
    this.activeHandle = null;
    this.startPoint = null;
    this.initialArtboardRect = null;
    this.renderArtboardOverlays();
  }

  public override onKeyDown(event: paper.KeyEvent): void {
    if (event.key === 'backspace' || event.key === 'delete') {
      const removed = this.editor.viewport.removeArtboard(this.editor.viewport.getActiveArtboardIndex());
      if (removed) {
        this.editor.renderArtboard();
        this.renderArtboardOverlays();
        this.editor.history.pushState();
      }
    }
  }

  private renderArtboardOverlays(): void {
    this.clearArtboardOverlays();

    const zoom = this.editor.viewport.getZoom();
    const artboards = this.editor.viewport.getArtboards();
    const activeIndex = this.editor.viewport.getActiveArtboardIndex();

    artboards.forEach((ab: ArtboardConfig, idx: number) => {
      const isActive = idx === activeIndex;
      const rect = new this.editor.scope.Rectangle(ab.x ?? 0, ab.y ?? 0, ab.width, ab.height);

      const group = new this.editor.scope.Group({ insert: false });
      group.data = { isArtboardToolOverlay: true };

      // Border outline
      const strokeColor = isActive ? new this.editor.scope.Color('#0080ff') : new this.editor.scope.Color('#71717a');
      const outline = new this.editor.scope.Path.Rectangle({
        rectangle: rect,
        strokeColor,
        strokeWidth: (isActive ? 2 : 1) / zoom,
        insert: false,
      });
      group.addChild(outline);

      // Name & Dimensions Badge above top-left
      const labelText = `${ab.name} · ${ab.width} × ${ab.height} px`;
      const text = new this.editor.scope.PointText({
        point: [rect.left + 8 / zoom, rect.top - 8 / zoom],
        content: labelText,
        fillColor: isActive ? new this.editor.scope.Color('#0080ff') : new this.editor.scope.Color('#a1a1aa'),
        fontSize: Math.max(10 / zoom, 8),
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 'bold',
        insert: false,
      });
      group.addChild(text);

      // 8 Handles for active artboard
      if (isActive) {
        const handles = this.getHandlePositions(rect);
        const handleSize = 7 / zoom;

        handles.forEach((h) => {
          const handleRect = new this.editor.scope.Path.Rectangle({
            center: h.point,
            size: [handleSize, handleSize],
            fillColor: new this.editor.scope.Color('#ffffff'),
            strokeColor: new this.editor.scope.Color('#0080ff'),
            strokeWidth: 1.5 / zoom,
            insert: false,
          });
          group.addChild(handleRect);
        });
      }

      this.editor.getOverlayLayer().addChild(group);
    });
  }

  private clearArtboardOverlays(): void {
    const overlays = this.editor.getOverlayLayer().children.filter((c: paper.Item) => c.data?.isArtboardToolOverlay);
    overlays.forEach((o: paper.Item) => o.remove());
  }

  private getHandlePositions(rect: paper.Rectangle): HandleInfo[] {
    return [
      { type: 'nw', point: rect.topLeft },
      { type: 'n', point: rect.topCenter },
      { type: 'ne', point: rect.topRight },
      { type: 'e', point: rect.rightCenter },
      { type: 'se', point: rect.bottomRight },
      { type: 's', point: rect.bottomCenter },
      { type: 'sw', point: rect.bottomLeft },
      { type: 'w', point: rect.leftCenter },
    ];
  }

  private hitTestHandles(point: paper.Point): HandleInfo | null {
    const activeAb = this.editor.viewport.getArtboard();
    const rect = new this.editor.scope.Rectangle(activeAb.x ?? 0, activeAb.y ?? 0, activeAb.width, activeAb.height);
    const handles = this.getHandlePositions(rect);
    const zoom = this.editor.viewport.getZoom();
    const hitRadius = 8 / zoom;

    for (const h of handles) {
      if (point.getDistance(h.point) <= hitRadius) {
        return h;
      }
    }
    return null;
  }

  private getCursorForHandle(handle: HandleType): string {
    switch (handle) {
      case 'nw':
      case 'se':
        return 'nwse-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
    }
  }
}
