import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

export class EraserTool extends Tool {
  public readonly type: ToolType = 'eraser';
  public readonly cursor: string = 'none'; // custom circle cursor rendered on overlay

  private radius: number = 16; // default eraser brush radius
  private isErasing: boolean = false;
  private hasErasedAny: boolean = false;
  private lastPoint: paper.Point | null = null;
  private cursorCircle: paper.Path.Circle | null = null;

  public override activate(): void {
    super.activate();
    this.renderCursorCircle(new paper.Point(-1000, -1000));
  }

  public override deactivate(): void {
    super.deactivate();
    this.removeCursorCircle();
    this.isErasing = false;
    this.lastPoint = null;
  }

  public override onMouseMove(event: paper.ToolEvent): void {
    this.renderCursorCircle(event.point);
  }

  public override onMouseDown(event: paper.ToolEvent): void {
    this.isErasing = true;
    this.hasErasedAny = false;
    this.lastPoint = event.point;
    this.renderCursorCircle(event.point);

    this.eraseAt(event.point);
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.isErasing || !this.lastPoint) return;
    this.renderCursorCircle(event.point);

    const dist = event.point.getDistance(this.lastPoint);
    const step = Math.max(4, this.radius / 2);

    if (dist <= step) {
      this.eraseAt(event.point);
    } else {
      // Interpolate points between lastPoint and currentPoint for gap-free smooth erasing
      const count = Math.ceil(dist / step);
      const delta = event.point.subtract(this.lastPoint).divide(count);
      for (let i = 1; i <= count; i++) {
        const intermediate = this.lastPoint.add(delta.multiply(i));
        this.eraseAt(intermediate);
      }
    }

    this.lastPoint = event.point;
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (this.isErasing && this.hasErasedAny) {
      this.editor.selectionManager.updateSelection();
      this.editor.history.pushState();
    }
    this.isErasing = false;
    this.lastPoint = null;
    this.renderCursorCircle(event.point);
  }

  public override onKeyDown(event: paper.KeyEvent): void {
    // [ and ] adjust eraser radius
    if (event.key === '[') {
      this.radius = Math.max(4, this.radius - 4);
      if (this.lastPoint) {
        this.renderCursorCircle(this.lastPoint);
      }
    } else if (event.key === ']') {
      this.radius = Math.min(100, this.radius + 4);
      if (this.lastPoint) {
        this.renderCursorCircle(this.lastPoint);
      }
    }
  }

  private eraseAt(point: paper.Point): void {
    const mainLayer = this.editor.getMainLayer();
    if (!mainLayer) return;

    const zoom = this.editor.viewport.getZoom();
    const eraserCircle = new paper.Path.Circle({
      center: point,
      radius: this.radius,
      insert: false,
    });
    const eraserBounds = eraserCircle.bounds;

    // If selection active, only erase selected items; otherwise erase any visible/unlocked item
    const selected = this.editor.selectionManager.getSelectedItems();
    let candidates: paper.Item[];

    if (selected.length > 0) {
      candidates = selected;
    } else {
      candidates = mainLayer.children.filter(
        (c) => c.visible && !c.locked && !(c instanceof paper.Layer)
      );
    }

    // Process items that intersect the eraser bounds
    const toProcess = candidates.filter((item) => {
      if (!item.bounds || item.bounds.width === 0 || item.bounds.height === 0) return false;
      return item.bounds.intersects(eraserBounds);
    });

    if (toProcess.length === 0) return;

    for (const item of toProcess) {
      // If item is completely inside the eraser circle, delete it
      if (
        eraserBounds.contains(item.bounds) &&
        eraserCircle.contains(item.bounds.topLeft) &&
        eraserCircle.contains(item.bounds.bottomRight)
      ) {
        item.remove();
        this.hasErasedAny = true;
        continue;
      }

      if (item instanceof paper.Path || item instanceof paper.CompoundPath) {
        try {
          // Perform Boolean subtraction
          const result = item.subtract(eraserCircle, { insert: false });
          if (result) {
            // Preserve original styling
            result.fillColor = item.fillColor ? item.fillColor.clone() : null as any;
            result.strokeColor = item.strokeColor ? item.strokeColor.clone() : null as any;
            result.strokeWidth = item.strokeWidth;
            result.strokeCap = item.strokeCap;
            result.strokeJoin = item.strokeJoin;
            result.dashArray = item.dashArray ? [...item.dashArray] : [];
            result.opacity = item.opacity;
            result.selected = item.selected;

            result.insertAbove(item);
            item.remove();
            this.hasErasedAny = true;
          }
        } catch {
          // In case Boolean math encounters degenerate geometry
        }
      } else if (item instanceof paper.Group) {
        // Erase child items of group
        for (const child of [...item.children]) {
          if (child instanceof paper.Path || child instanceof paper.CompoundPath) {
            try {
              const res = child.subtract(eraserCircle, { insert: false });
              if (res) {
                res.fillColor = child.fillColor ? child.fillColor.clone() : null as any;
                res.strokeColor = child.strokeColor ? child.strokeColor.clone() : null as any;
                res.strokeWidth = child.strokeWidth;
                res.insertAbove(child);
                child.remove();
                this.hasErasedAny = true;
              }
            } catch {
              // ignore
            }
          }
        }
      }
    }
  }

  private renderCursorCircle(point: paper.Point): void {
    const overlayLayer = this.editor.getOverlayLayer();
    if (!overlayLayer) return;

    this.removeCursorCircle();

    const zoom = this.editor.viewport.getZoom();
    overlayLayer.activate();
    this.cursorCircle = new paper.Path.Circle({
      center: point,
      radius: this.radius,
      strokeColor: new paper.Color('#ffffff'),
      strokeWidth: 1.5 / zoom,
      dashArray: [3 / zoom, 2 / zoom],
      fillColor: new paper.Color(255 / 255, 0 / 255, 100 / 255, 0.12),
      insert: false,
    });
    this.cursorCircle.data = { isEraserCursor: true };
    overlayLayer.addChild(this.cursorCircle);
    this.editor.getMainLayer().activate();
  }

  private removeCursorCircle(): void {
    if (this.cursorCircle) {
      try {
        this.cursorCircle.remove();
      } catch {
        // ignore
      }
      this.cursorCircle = null;
    }

    const helpers = this.editor.getOverlayLayer().children.filter((c) => c.data?.isEraserCursor);
    helpers.forEach((h) => h.remove());
  }
}
