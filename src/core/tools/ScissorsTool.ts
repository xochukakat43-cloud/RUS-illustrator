import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';
import type { Editor } from '../Editor';

export class ScissorsTool extends Tool {
  public readonly type: ToolType = 'scissors';
  public readonly cursor: string = 'crosshair';

  private hoverMarker: paper.Group | null = null;

  constructor(editor: Editor) {
    super(editor);
  }

  public override activate(): void {
    super.activate();
  }

  public override deactivate(): void {
    super.deactivate();
    this.clearHoverMarker();
  }

  public override onMouseMove(event: paper.ToolEvent): void {
    const zoom = this.editor.viewport.getZoom();
    const hit = this.editor.getMainLayer().hitTest(event.point, {
      stroke: true,
      curves: true,
      segments: true,
      tolerance: 7 / zoom,
    });

    if (hit && hit.item instanceof paper.Path && (hit.location || hit.point)) {
      const cutPoint = hit.location ? hit.location.point : hit.point;
      this.renderHoverMarker(cutPoint);
    } else {
      this.clearHoverMarker();
    }
  }

  public override onMouseDown(event: paper.ToolEvent): void {
    const zoom = this.editor.viewport.getZoom();
    const hit = this.editor.getMainLayer().hitTest(event.point, {
      stroke: true,
      curves: true,
      segments: true,
      tolerance: 7 / zoom,
    });

    if (!hit || !(hit.item instanceof paper.Path)) {
      return;
    }

    const path = hit.item;
    const location = hit.location || path.getNearestLocation(event.point);
    if (!location) return;

    const secondPath = path.splitAt(location);

    if (secondPath && secondPath !== path) {
      secondPath.style = path.style;
      secondPath.selected = true;
    }
    path.selected = true;

    this.clearHoverMarker();
    this.editor.notifySelectionChange();
    this.editor.history.pushState();
  }

  private renderHoverMarker(point: paper.Point): void {
    this.clearHoverMarker();

    const zoom = this.editor.viewport.getZoom();
    const r = 5 / zoom;
    const strokeW = 1.5 / zoom;

    const group = new this.editor.scope.Group({ insert: false });
    group.data = { isScissorsHover: true };

    const circle = new this.editor.scope.Path.Circle({
      center: point,
      radius: r,
      fillColor: new this.editor.scope.Color('#ffffff'),
      strokeColor: new this.editor.scope.Color('#00e5ff'),
      strokeWidth: strokeW,
    });
    group.addChild(circle);

    const cross1 = new this.editor.scope.Path.Line({
      from: point.subtract(new this.editor.scope.Point(r + 2 / zoom, 0)),
      to: point.add(new this.editor.scope.Point(r + 2 / zoom, 0)),
      strokeColor: new this.editor.scope.Color('#00e5ff'),
      strokeWidth: strokeW,
    });
    group.addChild(cross1);

    const cross2 = new this.editor.scope.Path.Line({
      from: point.subtract(new this.editor.scope.Point(0, r + 2 / zoom)),
      to: point.add(new this.editor.scope.Point(0, r + 2 / zoom)),
      strokeColor: new this.editor.scope.Color('#00e5ff'),
      strokeWidth: strokeW,
    });
    group.addChild(cross2);

    this.editor.getOverlayLayer().addChild(group);
    this.hoverMarker = group;
  }

  private clearHoverMarker(): void {
    if (this.hoverMarker) {
      this.hoverMarker.remove();
      this.hoverMarker = null;
    }
  }
}
