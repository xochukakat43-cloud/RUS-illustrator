import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

type TransformMode = 'none' | 'move' | 'scale' | 'rotate' | 'marquee';

export class SelectTool extends Tool {
  public readonly type: ToolType = 'select';
  public readonly cursor: string = 'default';

  private mode: TransformMode = 'none';
  private startPoint: paper.Point | null = null;
  private initialItemsBounds: paper.Rectangle | null = null;
  private marqueeBox: paper.Path.Rectangle | null = null;
  private activeHandle: string | null = null;
  private duplicateMade: boolean = false;

  public override onMouseDown(event: paper.ToolEvent): void {
    this.startPoint = event.point;
    this.duplicateMade = false;

    // Check if clicked on a transformation handle of bounding box overlay
    const overlayHit = this.hitTestOverlay(event.point);
    if (overlayHit) {
      this.mode = overlayHit.mode;
      this.activeHandle = overlayHit.handle;
      const selected = this.editor.selectionManager.getSelectedItems();
      if (selected.length > 0) {
        this.initialItemsBounds = this.getUnionBounds(selected);
      }
      return;
    }

    // Hit test on main layer items
    const zoom = this.editor.viewport.getZoom();
    const hitOptions = {
      segments: true,
      stroke: true,
      fill: true,
      tolerance: 6 / zoom,
    };

    const hitResult = this.editor.getMainLayer().hitTest(event.point, hitOptions);

    if (hitResult && hitResult.item) {
      let targetItem = hitResult.item;
      // If item is inside group, select highest group or item (NOT layer!)
      while (
        targetItem.parent &&
        targetItem.parent instanceof paper.Group &&
        !(targetItem.parent instanceof paper.Layer)
      ) {
        targetItem = targetItem.parent;
      }

      // Ensure targetItem is not a layer
      if (targetItem instanceof paper.Layer) {
        return;
      }

      const isShift = event.modifiers.shift;
      if (isShift) {
        targetItem.selected = !targetItem.selected;
      } else {
        if (!targetItem.selected) {
          this.editor.selectionManager.clearSelection();
          targetItem.selected = true;
        }
      }

      this.mode = 'move';
      this.editor.selectionManager.updateSelection();

      // Check for Alt-drag duplicate in onMouseDrag
    } else {
      // Clicked on empty space: marquee selection
      if (!event.modifiers.shift) {
        this.editor.selectionManager.clearSelection();
      }
      this.mode = 'marquee';
    }
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.startPoint) return;

    if (this.mode === 'move') {
      const selected = this.editor.selectionManager.getSelectedItems();
      if (selected.length === 0) return;

      // Illustrator Alt+Drag duplicate
      if (event.modifiers.alt && !this.duplicateMade) {
        const clones: paper.Item[] = [];
        selected.forEach((item) => {
          const clone = item.clone();
          item.selected = false;
          clone.selected = true;
          this.editor.getMainLayer().addChild(clone);
          clones.push(clone);
        });
        this.duplicateMade = true;
        this.editor.selectionManager.updateSelection();
      }

      let delta = event.delta;
      // Shift constrains move to horizontal/vertical
      if (event.modifiers.shift) {
        if (Math.abs(event.point.x - this.startPoint.x) > Math.abs(event.point.y - this.startPoint.y)) {
          delta = new paper.Point(delta.x, 0);
        } else {
          delta = new paper.Point(0, delta.y);
        }
      }

      const activeSelected = this.editor.selectionManager.getSelectedItems();
      activeSelected.forEach((item) => {
        item.position = item.position.add(delta);
      });
      this.editor.selectionManager.updateSelection();
    } else if (this.mode === 'marquee') {
      // Update marquee selection rectangle
      if (this.marqueeBox) {
        this.marqueeBox.remove();
      }

      const zoom = this.editor.viewport.getZoom();
      this.marqueeBox = new paper.Path.Rectangle({
        from: this.startPoint,
        to: event.point,
        strokeColor: new paper.Color('#0d99ff'),
        strokeWidth: 1 / zoom,
        dashArray: [4 / zoom, 4 / zoom],
        fillColor: new paper.Color(13 / 255, 153 / 255, 255 / 255, 0.08),
        insert: false,
      });
      this.editor.getOverlayLayer().addChild(this.marqueeBox);

      // Select items intersecting marquee
      const rect = new paper.Rectangle(this.startPoint, event.point);
      this.editor.getMainLayer().children.forEach((item) => {
        if (item.bounds.intersects(rect)) {
          item.selected = true;
        } else if (!event.modifiers.shift) {
          item.selected = false;
        }
      });
    } else if (this.mode === 'scale' && this.initialItemsBounds && this.activeHandle) {
      this.handleScale(event);
    } else if (this.mode === 'rotate') {
      this.handleRotate(event);
    }
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    const prevMode = this.mode;

    if (this.marqueeBox) {
      this.marqueeBox.remove();
      this.marqueeBox = null;
    }

    if (prevMode === 'marquee') {
      this.editor.selectionManager.updateSelection();
    } else if (prevMode === 'move' || prevMode === 'scale' || prevMode === 'rotate') {
      this.editor.history.pushState();
    }

    this.mode = 'none';
    this.startPoint = null;
    this.activeHandle = null;
    this.initialItemsBounds = null;
    this.duplicateMade = false;
  }

  private hitTestOverlay(point: paper.Point): { mode: TransformMode; handle: string } | null {
    const selected = this.editor.selectionManager.getSelectedItems();
    if (selected.length === 0) return null;

    const bounds = this.getUnionBounds(selected);
    const zoom = this.editor.viewport.getZoom();
    const handleRadius = 6 / zoom;

    // Check rotate handle (above top center)
    const rotateHandlePos = new paper.Point(bounds.center.x, bounds.top - 20 / zoom);
    if (point.getDistance(rotateHandlePos) <= handleRadius + 2 / zoom) {
      return { mode: 'rotate', handle: 'rot' };
    }

    // Check 8 scale handles
    const handles: Record<string, paper.Point> = {
      tl: bounds.topLeft,
      tc: new paper.Point(bounds.center.x, bounds.top),
      tr: bounds.topRight,
      rc: new paper.Point(bounds.right, bounds.center.y),
      br: bounds.bottomRight,
      bc: new paper.Point(bounds.center.x, bounds.bottom),
      bl: bounds.bottomLeft,
      lc: new paper.Point(bounds.left, bounds.center.y),
    };

    for (const [key, pos] of Object.entries(handles)) {
      if (point.getDistance(pos) <= handleRadius) {
        return { mode: 'scale', handle: key };
      }
    }

    return null;
  }

  private handleScale(event: paper.ToolEvent): void {
    const selected = this.editor.selectionManager.getSelectedItems();
    if (selected.length === 0 || !this.activeHandle) return;

    const bounds = this.getUnionBounds(selected);

    // Anchor opposite point based on active handle
    let anchor: paper.Point;
    switch (this.activeHandle) {
      case 'br':
        anchor = bounds.topLeft;
        break;
      case 'tl':
        anchor = bounds.bottomRight;
        break;
      case 'tr':
        anchor = bounds.bottomLeft;
        break;
      case 'bl':
        anchor = bounds.topRight;
        break;
      case 'tc':
        anchor = new paper.Point(bounds.center.x, bounds.bottom);
        break;
      case 'bc':
        anchor = new paper.Point(bounds.center.x, bounds.top);
        break;
      case 'lc':
        anchor = new paper.Point(bounds.right, bounds.center.y);
        break;
      case 'rc':
        anchor = new paper.Point(bounds.left, bounds.center.y);
        break;
      default:
        anchor = bounds.center;
    }

    const curDistX = event.point.x - anchor.x;
    const prevDistX = event.lastPoint.x - anchor.x;
    let sx = 1;
    if (
      this.activeHandle.includes('l') ||
      this.activeHandle.includes('r') ||
      this.activeHandle === 'bl' ||
      this.activeHandle === 'br' ||
      this.activeHandle === 'tl' ||
      this.activeHandle === 'tr'
    ) {
      if (Math.abs(prevDistX) > 0.1 && Math.abs(curDistX) > 0.1 && Math.sign(curDistX) === Math.sign(prevDistX)) {
        sx = curDistX / prevDistX;
      }
    }

    const curDistY = event.point.y - anchor.y;
    const prevDistY = event.lastPoint.y - anchor.y;
    let sy = 1;
    if (
      this.activeHandle.includes('t') ||
      this.activeHandle.includes('b') ||
      this.activeHandle === 'bl' ||
      this.activeHandle === 'br' ||
      this.activeHandle === 'tl' ||
      this.activeHandle === 'tr'
    ) {
      if (Math.abs(prevDistY) > 0.1 && Math.abs(curDistY) > 0.1 && Math.sign(curDistY) === Math.sign(prevDistY)) {
        sy = curDistY / prevDistY;
      }
    }

    if (
      isNaN(sx) ||
      isNaN(sy) ||
      !isFinite(sx) ||
      !isFinite(sy) ||
      sx <= 0.05 ||
      sy <= 0.05 ||
      sx > 10 ||
      sy > 10
    ) {
      return;
    }

    selected.forEach((item) => {
      item.scale(sx, sy, anchor);
    });

    this.editor.selectionManager.updateSelection();
  }

  private handleRotate(event: paper.ToolEvent): void {
    const selected = this.editor.selectionManager.getSelectedItems();
    if (selected.length === 0) return;

    const bounds = this.getUnionBounds(selected);
    const center = bounds.center;
    const angleDelta = event.point.subtract(center).angle - event.lastPoint.subtract(center).angle;

    selected.forEach((item) => {
      item.rotate(angleDelta, center);
    });
    this.editor.selectionManager.updateSelection();
  }

  private getUnionBounds(items: paper.Item[]): paper.Rectangle {
    let union = items[0].bounds.clone();
    for (let i = 1; i < items.length; i++) {
      union = union.unite(items[i].bounds);
    }
    return union;
  }
}
