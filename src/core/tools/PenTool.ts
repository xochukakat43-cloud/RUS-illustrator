import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

export class PenTool extends Tool {
  public readonly type: ToolType = 'pen';
  public readonly cursor: string = 'crosshair';

  private currentPath: paper.Path | null = null;
  private currentSegment: paper.Segment | null = null;
  private rubberband: paper.Path.Line | null = null;
  private isDraggingHandle: boolean = false;

  public override activate(): void {
    this.finishPath();
  }

  public override deactivate(): void {
    this.finishPath();
  }

  public override onMouseDown(event: paper.ToolEvent): void {
    const zoom = this.editor.viewport.getZoom();
    const hitTolerance = 10 / zoom;

    // Check if clicking near the starting segment to close path
    if (this.currentPath && this.currentPath.segments.length > 2) {
      const firstSegment = this.currentPath.firstSegment;
      if (firstSegment.point.getDistance(event.point) <= hitTolerance) {
        this.currentPath.closed = true;
        this.finishPath();
        return;
      }
    }

    if (!this.currentPath) {
      // Begin a new path
      this.editor.selectionManager.clearSelection();
      const style = this.editor.getActiveStyle();

      this.currentPath = new paper.Path({
        strokeColor: style.strokeColor || '#0d99ff',
        fillColor: style.fillColor || undefined,
        strokeWidth: style.strokeWidth || 2,
        strokeCap: style.strokeCap,
        strokeJoin: style.strokeJoin,
        opacity: style.opacity,
      });
      this.editor.getMainLayer().addChild(this.currentPath);

      this.currentSegment = this.currentPath.add(event.point) as paper.Segment;
      this.currentPath.selected = true;
    } else {
      // Append segment to existing path
      this.currentSegment = this.currentPath.add(event.point) as paper.Segment;
    }

    this.isDraggingHandle = true;
    this.removeRubberband();
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.isDraggingHandle || !this.currentSegment) return;

    // Dragging creates symmetric Bezier curve handles
    const delta = event.point.subtract(this.currentSegment.point);
    this.currentSegment.handleOut = delta;
    this.currentSegment.handleIn = delta.multiply(-1);
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    this.isDraggingHandle = false;
  }

  public override onMouseMove(event: paper.ToolEvent): void {
    if (!this.currentPath || this.currentPath.segments.length === 0) {
      this.removeRubberband();
      return;
    }

    const lastPoint = this.currentPath.lastSegment.point;
    this.removeRubberband();

    this.rubberband = new paper.Path.Line({
      from: lastPoint,
      to: event.point,
      strokeColor: new paper.Color('#0d99ff'),
      strokeWidth: 1,
      dashArray: [4, 4],
    });
    this.editor.getOverlayLayer().addChild(this.rubberband);
  }

  public override onKeyDown(event: paper.KeyEvent): void {
    if (event.key === 'enter' || event.key === 'escape') {
      this.finishPath();
    }
  }

  public finishPath(): void {
    this.removeRubberband();

    if (this.currentPath) {
      if (this.currentPath.segments.length < 2) {
        this.currentPath.remove();
      } else {
        this.currentPath.selected = true;
        this.editor.selectionManager.updateSelection();
        this.editor.history.pushState();
      }
      this.currentPath = null;
      this.currentSegment = null;
    }
  }

  private removeRubberband(): void {
    if (this.rubberband) {
      this.rubberband.remove();
      this.rubberband = null;
    }
  }
}
