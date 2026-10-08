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
      strokeColor: style.strokeColor || '#000000',
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
      strokeColor: style.strokeColor || '#000000',
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

/**
 * Applies non-destructive live corner rounding to any polygon or path.
 */
export function applyCornerRadius(path: paper.Path, radius: number): void {
  if (!path || !(path instanceof paper.Path) || path.segments.length < 3) return;

  // Initialize or retrieve original sharp base points
  if (!path.data.basePoints || path.data.basePoints.length === 0) {
    path.data.basePoints = path.segments.map((s) => s.point.clone());
  }

  const basePoints: paper.Point[] = path.data.basePoints;
  const n = basePoints.length;

  if (radius <= 0) {
    // Restore original sharp polygon
    path.segments = basePoints.map((pt) => new paper.Segment(pt.clone()));
    path.data.cornerRadius = 0;
    return;
  }

  const newSegments: paper.Segment[] = [];

  for (let i = 0; i < n; i++) {
    const prev = basePoints[(i - 1 + n) % n];
    const curr = basePoints[i];
    const next = basePoints[(i + 1) % n];

    const u = prev.subtract(curr);
    const v = next.subtract(curr);
    const lenU = u.length;
    const lenV = v.length;

    if (lenU < 0.001 || lenV < 0.001) {
      newSegments.push(new paper.Segment(curr.clone()));
      continue;
    }

    const dirU = u.divide(lenU);
    const dirV = v.divide(lenV);

    const cosTheta = Math.max(-1, Math.min(1, dirU.dot(dirV)));
    const theta = Math.acos(cosTheta);

    if (theta < 0.01 || theta > Math.PI - 0.01) {
      newSegments.push(new paper.Segment(curr.clone()));
      continue;
    }

    const halfAngle = theta / 2;
    const d = radius / Math.tan(halfAngle);
    const maxD = Math.min(lenU / 2, lenV / 2);
    const effectiveD = Math.min(d, maxD);
    const effectiveR = effectiveD * Math.tan(halfAngle);

    const t1 = curr.add(dirU.multiply(effectiveD));
    const t2 = curr.add(dirV.multiply(effectiveD));

    const alpha = Math.PI - theta;
    const handleLen = (4 / 3) * Math.tan(alpha / 4) * effectiveR;

    const seg1 = new paper.Segment(t1, undefined, dirU.multiply(-handleLen));
    const seg2 = new paper.Segment(t2, dirV.multiply(-handleLen), undefined);

    newSegments.push(seg1, seg2);
  }

  path.segments = newSegments;
  path.data.cornerRadius = radius;
}

export class PolygonTool extends Tool {
  public readonly type: ToolType = 'polygon';
  public readonly cursor: string = 'crosshair';

  private startPoint: paper.Point | null = null;
  private currentItem: paper.Path | null = null;
  private sides: number = 6;

  public override onMouseDown(event: paper.ToolEvent): void {
    this.startPoint = event.point;
    this.editor.selectionManager.clearSelection();

    this.renderPolygon(event.point, 0);
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.startPoint) return;
    const radius = event.point.getDistance(this.startPoint);
    let angle = event.point.subtract(this.startPoint).angle;

    // Shift constrains rotation angle to 45 deg increments
    if (event.modifiers.shift) {
      angle = Math.round(angle / 45) * 45;
    }

    this.renderPolygon(this.startPoint, radius, angle);
  }

  public override onKeyDown(event: paper.KeyEvent): void {
    // Up / Down arrow keys adjust side count during creation
    if (event.key === 'up') {
      this.sides = Math.min(64, this.sides + 1);
      if (this.startPoint && this.currentItem) {
        const radius = this.currentItem.bounds.width / 2;
        this.renderPolygon(this.startPoint, radius);
      }
    } else if (event.key === 'down') {
      this.sides = Math.max(3, this.sides - 1);
      if (this.startPoint && this.currentItem) {
        const radius = this.currentItem.bounds.width / 2;
        this.renderPolygon(this.startPoint, radius);
      }
    }
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (!this.currentItem) return;

    if (this.currentItem.bounds.width < 2 && this.currentItem.bounds.height < 2) {
      this.currentItem.remove();
    } else {
      // Store sharp base points for live corner radius support
      this.currentItem.data.basePoints = this.currentItem.segments.map((s) => s.point.clone());
      this.currentItem.data.sides = this.sides;
      this.currentItem.selected = true;
      this.editor.selectionManager.updateSelection();
      this.editor.history.pushState();
    }

    this.currentItem = null;
    this.startPoint = null;
  }

  private renderPolygon(center: paper.Point, radius: number, rotationDeg: number = -90): void {
    if (this.currentItem) {
      this.currentItem.remove();
    }

    const style = this.editor.getActiveStyle();
    this.currentItem = new paper.Path({
      fillColor: style.fillColor || undefined,
      strokeColor: style.strokeColor || '#000000',
      strokeWidth: style.strokeWidth || 2,
      strokeCap: style.strokeCap,
      strokeJoin: style.strokeJoin,
      opacity: style.opacity,
      closed: true,
    });

    const step = (Math.PI * 2) / this.sides;
    const rotRad = (rotationDeg * Math.PI) / 180;

    for (let i = 0; i < this.sides; i++) {
      const a = i * step + rotRad;
      const pt = new paper.Point(center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius);
      this.currentItem.add(pt);
    }

    this.editor.getMainLayer().addChild(this.currentItem);
  }
}

export class StarTool extends Tool {
  public readonly type: ToolType = 'star';
  public readonly cursor: string = 'crosshair';

  private startPoint: paper.Point | null = null;
  private currentItem: paper.Path | null = null;
  private points: number = 5;
  private innerRatio: number = 0.45;

  public override onMouseDown(event: paper.ToolEvent): void {
    this.startPoint = event.point;
    this.editor.selectionManager.clearSelection();

    this.renderStar(event.point, 0);
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.startPoint) return;
    const outerRadius = event.point.getDistance(this.startPoint);
    let angle = event.point.subtract(this.startPoint).angle;

    // Shift constrains rotation
    if (event.modifiers.shift) {
      angle = Math.round(angle / 45) * 45;
    }

    this.renderStar(this.startPoint, outerRadius, angle);
  }

  public override onKeyDown(event: paper.KeyEvent): void {
    // Up / Down arrow keys adjust point count during creation
    if (event.key === 'up') {
      this.points = Math.min(50, this.points + 1);
      if (this.startPoint && this.currentItem) {
        const radius = this.currentItem.bounds.width / 2;
        this.renderStar(this.startPoint, radius);
      }
    } else if (event.key === 'down') {
      this.points = Math.max(3, this.points - 1);
      if (this.startPoint && this.currentItem) {
        const radius = this.currentItem.bounds.width / 2;
        this.renderStar(this.startPoint, radius);
      }
    }
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (!this.currentItem) return;

    if (this.currentItem.bounds.width < 2 && this.currentItem.bounds.height < 2) {
      this.currentItem.remove();
    } else {
      // Store sharp base points for live corner radius support
      this.currentItem.data.basePoints = this.currentItem.segments.map((s) => s.point.clone());
      this.currentItem.data.points = this.points;
      this.currentItem.selected = true;
      this.editor.selectionManager.updateSelection();
      this.editor.history.pushState();
    }

    this.currentItem = null;
    this.startPoint = null;
  }

  private renderStar(center: paper.Point, outerRadius: number, rotationDeg: number = -90): void {
    if (this.currentItem) {
      this.currentItem.remove();
    }

    const style = this.editor.getActiveStyle();
    this.currentItem = new paper.Path({
      fillColor: style.fillColor || undefined,
      strokeColor: style.strokeColor || '#000000',
      strokeWidth: style.strokeWidth || 2,
      strokeCap: style.strokeCap,
      strokeJoin: style.strokeJoin,
      opacity: style.opacity,
      closed: true,
    });

    const innerRadius = outerRadius * this.innerRatio;
    const totalVertices = this.points * 2;
    const step = Math.PI / this.points;
    const rotRad = (rotationDeg * Math.PI) / 180;

    for (let i = 0; i < totalVertices; i++) {
      const a = i * step + rotRad;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const pt = new paper.Point(center.x + Math.cos(a) * r, center.y + Math.sin(a) * r);
      this.currentItem.add(pt);
    }

    this.editor.getMainLayer().addChild(this.currentItem);
  }
}
