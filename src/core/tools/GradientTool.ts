import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

type GradientInteractionMode = 'none' | 'drag-vector' | 'drag-origin' | 'drag-destination';

export class GradientTool extends Tool {
  public readonly type: ToolType = 'gradient';
  public readonly cursor: string = 'crosshair';

  private mode: GradientInteractionMode = 'none';
  private downPoint: paper.Point | null = null;
  private annotatorGroup: paper.Group | null = null;

  public override activate(): void {
    super.activate();
    this.renderAnnotator();
  }

  public override deactivate(): void {
    super.deactivate();
    this.clearAnnotator();
    this.mode = 'none';
    this.downPoint = null;
  }

  public override onMouseDown(event: paper.ToolEvent): void {
    this.downPoint = event.point;

    // 1. Check if clicking on an existing annotator handle
    const handleHit = this.hitTestAnnotator(event.point);
    if (handleHit) {
      this.mode = handleHit;
      return;
    }

    // 2. Hit test main layer items
    const zoom = this.editor.viewport.getZoom();
    const hitOptions = {
      fill: true,
      stroke: true,
      tolerance: 6 / zoom,
    };
    const hit = this.editor.getMainLayer().hitTest(event.point, hitOptions);

    if (hit && hit.item && !(hit.item instanceof paper.Layer)) {
      let target = hit.item;
      while (
        target.parent &&
        target.parent instanceof paper.Group &&
        !(target.parent instanceof paper.Layer)
      ) {
        target = target.parent;
      }

      if (!target.selected) {
        this.editor.selectionManager.selectItem(target);
      }
    }

    const selected = this.editor.selectionManager.getSelectedItems();
    if (selected.length === 0) {
      this.mode = 'none';
      return;
    }

    const targetItem = selected[0];
    // Ensure item has a gradient fillColor
    if (!targetItem.fillColor || !(targetItem.fillColor as any).gradient) {
      const startColor = targetItem.fillColor ? targetItem.fillColor.toCSS(true) : '#3b82f6';
      const endColor = '#9333ea';
      const pGradient = new (paper as any).Gradient(
        [
          new paper.GradientStop(new paper.Color(startColor), 0),
          new paper.GradientStop(new paper.Color(endColor), 1),
        ],
        false
      );
      targetItem.fillColor = new paper.Color(pGradient, event.point, event.point.add(new paper.Point(100, 0)));
    }

    this.mode = 'drag-vector';
    this.renderAnnotator();
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    const selected = this.editor.selectionManager.getSelectedItems();
    if (selected.length === 0 || !this.downPoint) return;

    const targetItem = selected[0];
    const fillColor = targetItem.fillColor as any;
    if (!fillColor || !fillColor.gradient) return;

    if (this.mode === 'drag-vector') {
      fillColor.origin = this.downPoint;
      fillColor.destination = event.point;
    } else if (this.mode === 'drag-origin') {
      fillColor.origin = event.point;
    } else if (this.mode === 'drag-destination') {
      fillColor.destination = event.point;
    }

    // 60 FPS: update visual manipulators directly without React state spam
    this.renderAnnotator();
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (this.mode !== 'none') {
      this.editor.selectionManager.updateSelection();
      this.editor.history.pushState();
    }
    this.mode = 'none';
    this.downPoint = null;
    this.renderAnnotator();
  }

  private hitTestAnnotator(point: paper.Point): GradientInteractionMode | null {
    const selected = this.editor.selectionManager.getSelectedItems();
    if (selected.length === 0) return null;

    const item = selected[0];
    const fillColor = item.fillColor as any;
    if (!fillColor || !fillColor.gradient || !fillColor.origin || !fillColor.destination) {
      return null;
    }

    const zoom = this.editor.viewport.getZoom();
    const handleRadius = 8 / zoom;

    if (point.getDistance(fillColor.origin) <= handleRadius) {
      return 'drag-origin';
    }

    if (point.getDistance(fillColor.destination) <= handleRadius) {
      return 'drag-destination';
    }

    return null;
  }

  public renderAnnotator(): void {
    this.clearAnnotator();

    const selected = this.editor.selectionManager.getSelectedItems();
    if (selected.length === 0) return;

    const item = selected[0];
    const fillColor = item.fillColor as any;
    if (!fillColor || !fillColor.gradient || !fillColor.origin || !fillColor.destination) {
      return;
    }

    const zoom = this.editor.viewport.getZoom();
    const overlayLayer = this.editor.getOverlayLayer();
    overlayLayer.activate();

    this.annotatorGroup = new paper.Group();
    this.annotatorGroup.data = { isGradientAnnotator: true };

    const origin: paper.Point = fillColor.origin;
    const dest: paper.Point = fillColor.destination;

    // Stem line connecting origin to destination
    const stem = new paper.Path.Line({
      from: origin,
      to: dest,
      strokeColor: new paper.Color('#ffffff'),
      strokeWidth: 2 / zoom,
      shadowColor: new paper.Color(0, 0, 0, 0.6),
      shadowBlur: 3 / zoom,
      insert: false,
    });
    this.annotatorGroup.addChild(stem);

    // Origin handle (Circle)
    const originCircle = new paper.Path.Circle({
      center: origin,
      radius: 6 / zoom,
      fillColor: new paper.Color('#3b82f6'),
      strokeColor: new paper.Color('#ffffff'),
      strokeWidth: 2 / zoom,
      insert: false,
    });
    this.annotatorGroup.addChild(originCircle);

    // Destination handle (Square)
    const destSquare = new paper.Path.Rectangle({
      center: dest,
      size: [12 / zoom, 12 / zoom],
      fillColor: new paper.Color('#9333ea'),
      strokeColor: new paper.Color('#ffffff'),
      strokeWidth: 2 / zoom,
      insert: false,
    });
    this.annotatorGroup.addChild(destSquare);

    // Stop ticks along the line
    const gradient = fillColor.gradient;
    if (gradient && gradient.stops) {
      const vec = dest.subtract(origin);
      gradient.stops.forEach((stop: any) => {
        const stopPos = origin.add(vec.multiply(stop.offset ?? 0));
        const tick = new paper.Path.Circle({
          center: stopPos,
          radius: 4 / zoom,
          fillColor: stop.color || new paper.Color('#ffffff'),
          strokeColor: new paper.Color('#000000'),
          strokeWidth: 1.5 / zoom,
          insert: false,
        });
        this.annotatorGroup?.addChild(tick);
      });
    }

    overlayLayer.addChild(this.annotatorGroup);
    this.editor.getMainLayer().activate();
  }

  private clearAnnotator(): void {
    if (this.annotatorGroup) {
      try {
        this.annotatorGroup.remove();
      } catch {
        // ignore
      }
      this.annotatorGroup = null;
    }

    const helpers = this.editor.getOverlayLayer().children.filter((c) => c.data?.isGradientAnnotator);
    helpers.forEach((h) => h.remove());
  }
}
