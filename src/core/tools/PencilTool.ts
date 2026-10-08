import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

export class PencilTool extends Tool {
  public readonly type: ToolType = 'pencil';
  public readonly cursor: string = 'crosshair';

  private currentPath: paper.Path | null = null;

  public override onMouseDown(event: paper.ToolEvent): void {
    this.editor.selectionManager.clearSelection();
    const style = this.editor.getActiveStyle();

    this.currentPath = new paper.Path({
      strokeColor: style.strokeColor || '#000000',
      fillColor: style.fillColor || undefined,
      strokeWidth: style.strokeWidth || 2,
      strokeCap: style.strokeCap || 'round',
      strokeJoin: style.strokeJoin || 'round',
      opacity: style.opacity ?? 1,
    });

    if (style.dashArray && style.dashArray.length > 0) {
      this.currentPath.dashArray = style.dashArray;
    }

    this.editor.getMainLayer().addChild(this.currentPath);
    this.currentPath.add(event.point);
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.currentPath) return;
    this.currentPath.add(event.point);
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (!this.currentPath) return;

    if (this.currentPath.segments.length < 2) {
      this.currentPath.remove();
    } else {
      // Smooth and simplify path to produce clean organic Bezier curves
      this.currentPath.simplify(10);
      this.currentPath.smooth({ type: 'continuous' });
      this.currentPath.selected = true;
      this.editor.selectionManager.updateSelection();
      this.editor.history.pushState();
    }

    this.currentPath = null;
  }
}
