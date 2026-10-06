import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

export class RectangleTool extends Tool {
  public readonly type: ToolType = 'rectangle';
  public readonly cursor: string = 'crosshair';

  private startPoint: paper.Point | null = null;
  private currentItem: paper.Path.Rectangle | null = null;

  public override onMouseDown(event: paper.ToolEvent): void {
    this.startPoint = event.point;
    this.editor.selectionManager.clearSelection();

    const style = this.editor.getActiveStyle();
    this.currentItem = new paper.Path.Rectangle({
      from: event.point,
      to: event.point,
      fillColor: style.fillColor || undefined,
      strokeColor: style.strokeColor || undefined,
      strokeWidth: style.strokeWidth,
      strokeCap: style.strokeCap,
      strokeJoin: style.strokeJoin,
      opacity: style.opacity,
    });
    this.editor.getMainLayer().addChild(this.currentItem);
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.startPoint || !this.currentItem) return;

    let toPoint = event.point;
    let fromPoint = this.startPoint;

    // Shift key: constrain to square
    if (event.modifiers.shift) {
      const dx = toPoint.x - fromPoint.x;
      const dy = toPoint.y - fromPoint.y;
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      toPoint = new paper.Point(
        fromPoint.x + Math.sign(dx || 1) * size,
        fromPoint.y + Math.sign(dy || 1) * size
      );
    }

    // Alt key: draw from center
    if (event.modifiers.alt) {
      const halfW = Math.abs(toPoint.x - fromPoint.x);
      const halfH = Math.abs(toPoint.y - fromPoint.y);
      fromPoint = new paper.Point(this.startPoint.x - halfW, this.startPoint.y - halfH);
      toPoint = new paper.Point(this.startPoint.x + halfW, this.startPoint.y + halfH);
    }

    this.currentItem.remove();
    const style = this.editor.getActiveStyle();
    this.currentItem = new paper.Path.Rectangle({
      from: fromPoint,
      to: toPoint,
      fillColor: style.fillColor || undefined,
      strokeColor: style.strokeColor || undefined,
      strokeWidth: style.strokeWidth,
      strokeCap: style.strokeCap,
      strokeJoin: style.strokeJoin,
      opacity: style.opacity,
    });
    this.editor.getMainLayer().addChild(this.currentItem);
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (!this.currentItem) return;

    if (this.currentItem.bounds.width < 1 && this.currentItem.bounds.height < 1) {
      this.currentItem.remove();
    } else {
      this.currentItem.selected = true;
      this.editor.selectionManager.updateSelection();
      this.editor.history.pushState();
    }
    this.currentItem = null;
    this.startPoint = null;
  }
}

export class EllipseTool extends Tool {
  public readonly type: ToolType = 'ellipse';
  public readonly cursor: string = 'crosshair';

  private startPoint: paper.Point | null = null;
  private currentItem: paper.Path.Ellipse | null = null;

  public override onMouseDown(event: paper.ToolEvent): void {
    this.startPoint = event.point;
    this.editor.selectionManager.clearSelection();

    const style = this.editor.getActiveStyle();
    this.currentItem = new paper.Path.Ellipse({
      point: event.point,
      size: [0, 0],
      fillColor: style.fillColor || undefined,
      strokeColor: style.strokeColor || undefined,
      strokeWidth: style.strokeWidth,
      opacity: style.opacity,
    });
    this.editor.getMainLayer().addChild(this.currentItem);
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.startPoint || !this.currentItem) return;

    let toPoint = event.point;
    let fromPoint = this.startPoint;

    // Shift key: constrain to circle
    if (event.modifiers.shift) {
      const dx = toPoint.x - fromPoint.x;
      const dy = toPoint.y - fromPoint.y;
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      toPoint = new paper.Point(
        fromPoint.x + Math.sign(dx || 1) * size,
        fromPoint.y + Math.sign(dy || 1) * size
      );
    }

    // Alt key: draw from center
    if (event.modifiers.alt) {
      const halfW = Math.abs(toPoint.x - fromPoint.x);
      const halfH = Math.abs(toPoint.y - fromPoint.y);
      fromPoint = new paper.Point(this.startPoint.x - halfW, this.startPoint.y - halfH);
      toPoint = new paper.Point(this.startPoint.x + halfW, this.startPoint.y + halfH);
    }

    const rect = new paper.Rectangle(fromPoint, toPoint);
    this.currentItem.remove();
    const style = this.editor.getActiveStyle();
    this.currentItem = new paper.Path.Ellipse({
      rectangle: rect,
      fillColor: style.fillColor || undefined,
      strokeColor: style.strokeColor || undefined,
      strokeWidth: style.strokeWidth,
      opacity: style.opacity,
    });
    this.editor.getMainLayer().addChild(this.currentItem);
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (!this.currentItem) return;

    if (this.currentItem.bounds.width < 1 && this.currentItem.bounds.height < 1) {
      this.currentItem.remove();
    } else {
      this.currentItem.selected = true;
      this.editor.selectionManager.updateSelection();
      this.editor.history.pushState();
    }
    this.currentItem = null;
    this.startPoint = null;
  }
}

export class LineTool extends Tool {
  public readonly type: ToolType = 'line';
  public readonly cursor: string = 'crosshair';

  private startPoint: paper.Point | null = null;
  private currentItem: paper.Path.Line | null = null;

  public override onMouseDown(event: paper.ToolEvent): void {
    this.startPoint = event.point;
    this.editor.selectionManager.clearSelection();

    const style = this.editor.getActiveStyle();
    this.currentItem = new paper.Path.Line({
      from: event.point,
      to: event.point,
      strokeColor: style.strokeColor || '#ffffff',
      strokeWidth: style.strokeWidth || 2,
      strokeCap: style.strokeCap,
      opacity: style.opacity,
    });
    this.editor.getMainLayer().addChild(this.currentItem);
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.startPoint || !this.currentItem) return;

    let toPoint = event.point;

    // Shift key: snap to 0, 45, 90, 135, 180 deg
    if (event.modifiers.shift) {
      const delta = toPoint.subtract(this.startPoint);
      const angle = (delta.angle + 360) % 360;
      const snappedAngle = Math.round(angle / 45) * 45;
      const length = delta.length;
      const rad = (snappedAngle * Math.PI) / 180;
      toPoint = new paper.Point(
        this.startPoint.x + Math.cos(rad) * length,
        this.startPoint.y + Math.sin(rad) * length
      );
    }

    this.currentItem.remove();
    const style = this.editor.getActiveStyle();
    this.currentItem = new paper.Path.Line({
      from: this.startPoint,
      to: toPoint,
      strokeColor: style.strokeColor || '#ffffff',
      strokeWidth: style.strokeWidth || 2,
      strokeCap: style.strokeCap,
      opacity: style.opacity,
    });
    this.editor.getMainLayer().addChild(this.currentItem);
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (!this.currentItem) return;

    if (this.currentItem.length < 1) {
      this.currentItem.remove();
    } else {
      this.currentItem.selected = true;
      this.editor.selectionManager.updateSelection();
      this.editor.history.pushState();
    }
    this.currentItem = null;
    this.startPoint = null;
  }
}
