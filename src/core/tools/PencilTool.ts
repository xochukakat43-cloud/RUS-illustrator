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

    // A freehand pencil stroke must not have an open polygon fill
    this.currentPath = new paper.Path({
      strokeColor: style.strokeColor || '#000000',
      fillColor: null as any,
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
      const zoom = this.editor.viewport.getZoom();
      const firstPoint = this.currentPath.firstSegment.point;
      const lastPoint = this.currentPath.lastSegment.point;

      // If user drew a loop and released near the start point, close it
      if (firstPoint.getDistance(lastPoint) <= 14 / zoom) {
        this.currentPath.closed = true;
        const style = this.editor.getActiveStyle();
        if (style.fillColor) {
          this.currentPath.fillColor = new paper.Color(style.fillColor);
        }
      }

      // Smooth path with standard Illustrator tolerance without over-distorting
      this.currentPath.simplify(2.5);

      this.currentPath.selected = true;
      this.editor.selectionManager.updateSelection();
      this.editor.history.pushState();
    }

    this.currentPath = null;
  }
}
