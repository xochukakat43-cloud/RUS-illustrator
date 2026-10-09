import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';
import type { Editor } from '../Editor';

export class ShapeBuilderTool extends Tool {
  public readonly type: ToolType = 'shape-builder';
  public readonly cursor: string = 'crosshair';

  private dragPath: paper.Path | null = null;
  private traversedItems: Set<paper.PathItem> = new Set();
  private isAltMode: boolean = false;

  constructor(editor: Editor) {
    super(editor);
  }

  public override activate(): void {
    super.activate();
  }

  public override deactivate(): void {
    super.deactivate();
    this.cleanup();
  }

  public override onMouseDown(event: paper.ToolEvent): void {
    this.cleanup();
    this.isAltMode = !!(event.modifiers.alt || event.modifiers.option);

    const zoom = this.editor.viewport.getZoom();
    const color = this.isAltMode ? new this.editor.scope.Color('#ef4444') : new this.editor.scope.Color('#ff6d00');

    this.dragPath = new this.editor.scope.Path({
      segments: [event.point],
      strokeColor: color,
      strokeWidth: 2 / zoom,
      dashArray: [5 / zoom, 3 / zoom],
      insert: false,
    });
    this.editor.getOverlayLayer().addChild(this.dragPath);

    this.collectItemAt(event.point);
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.dragPath) return;

    this.dragPath.add(event.point);
    this.collectItemAt(event.point);
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (!this.dragPath) return;

    const items = Array.from(this.traversedItems);
    this.cleanup();

    if (items.length === 0) return;

    const isAlt = !!(event.modifiers.alt || event.modifiers.option || this.isAltMode);

    if (isAlt) {
      if (items.length === 1) {
        items[0].remove();
      } else {
        let base = items[0];
        const style = base.style;
        for (let i = 1; i < items.length; i++) {
          const next = items[i];
          const subtracted = base.subtract(next) as paper.PathItem;
          if (subtracted) {
            base.remove();
            next.remove();
            base = subtracted;
            base.style = style;
          }
        }
        this.editor.getMainLayer().addChild(base);
        base.selected = true;
      }
    } else {
      if (items.length >= 2) {
        let base = items[0];
        const style = base.style;
        for (let i = 1; i < items.length; i++) {
          const next = items[i];
          const united = base.unite(next) as paper.PathItem;
          if (united) {
            base.remove();
            next.remove();
            base = united;
            base.style = style;
          }
        }
        this.editor.getMainLayer().addChild(base);
        base.selected = true;
      }
    }

    this.editor.notifySelectionChange();
    this.editor.history.pushState();
  }

  private collectItemAt(point: paper.Point): void {
    const zoom = this.editor.viewport.getZoom();
    const hit = this.editor.getMainLayer().hitTest(point, {
      fill: true,
      stroke: true,
      tolerance: 4 / zoom,
    });

    if (hit && hit.item && (hit.item instanceof paper.Path || hit.item instanceof paper.CompoundPath)) {
      let target: paper.Item = hit.item;
      while (
        target.parent &&
        target.parent instanceof paper.Group &&
        !(target.parent instanceof paper.Layer)
      ) {
        target = target.parent;
      }

      if (target instanceof paper.Path || target instanceof paper.CompoundPath) {
        this.traversedItems.add(target);
        target.selected = true;
      }
    }
  }

  private cleanup(): void {
    if (this.dragPath) {
      this.dragPath.remove();
      this.dragPath = null;
    }
    this.traversedItems.clear();
  }
}
