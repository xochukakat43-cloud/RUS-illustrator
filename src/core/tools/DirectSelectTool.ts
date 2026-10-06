import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

type DirectDragMode = 'none' | 'segment' | 'handle-in' | 'handle-out';

export class DirectSelectTool extends Tool {
  public readonly type: ToolType = 'direct-select';
  public readonly cursor: string = 'default';

  private dragMode: DirectDragMode = 'none';
  private targetSegment: paper.Segment | null = null;

  public override activate(): void {
    // When direct select tool is activated, paths can show handles
    const selected = this.editor.selectionManager.getSelectedItems();
    selected.forEach((item) => {
      if (item instanceof paper.Path) {
        item.fullySelected = true;
      }
    });
  }

  public override deactivate(): void {
    const selected = this.editor.selectionManager.getSelectedItems();
    selected.forEach((item) => {
      if (item instanceof paper.Path) {
        item.fullySelected = false;
      }
    });
  }

  public override onMouseDown(event: paper.ToolEvent): void {
    const zoom = this.editor.viewport.getZoom();
    const tolerance = 8 / zoom;

    const hitOptions = {
      segments: true,
      handles: true,
      stroke: true,
      fill: true,
      tolerance,
    };

    const hitResult = this.editor.getMainLayer().hitTest(event.point, hitOptions);

    if (hitResult) {
      const item = hitResult.item;

      if (hitResult.type === 'handle-in') {
        this.dragMode = 'handle-in';
        this.targetSegment = hitResult.segment;
        this.editor.selectionManager.setSelectedSegment(hitResult.segment, 'in');
        return;
      }

      if (hitResult.type === 'handle-out') {
        this.dragMode = 'handle-out';
        this.targetSegment = hitResult.segment;
        this.editor.selectionManager.setSelectedSegment(hitResult.segment, 'out');
        return;
      }

      if (hitResult.type === 'segment') {
        this.dragMode = 'segment';
        this.targetSegment = hitResult.segment;
        if (item instanceof paper.Path) {
          item.fullySelected = true;
        }
        this.editor.selectionManager.setSelectedSegment(hitResult.segment);
        return;
      }

      // Hit stroke or fill: select path
      if (!event.modifiers.shift) {
        this.editor.selectionManager.clearSelection();
      }
      item.selected = true;
      if (item instanceof paper.Path) {
        item.fullySelected = true;
      }
      this.editor.selectionManager.setSelectedSegment(null);
      this.dragMode = 'none';
    } else {
      // Clicked on empty space
      if (!event.modifiers.shift) {
        this.editor.selectionManager.clearSelection();
      }
      this.editor.selectionManager.setSelectedSegment(null);
      this.dragMode = 'none';
    }
  }

  public override onMouseDrag(event: paper.ToolEvent): void {
    if (!this.targetSegment) return;

    if (this.dragMode === 'segment') {
      // Move anchor point
      this.targetSegment.point = this.targetSegment.point.add(event.delta);
      this.editor.selectionManager.updateSelection();
    } else if (this.dragMode === 'handle-in') {
      // Adjust handle-in
      const newHandleIn = event.point.subtract(this.targetSegment.point);
      this.targetSegment.handleIn = newHandleIn;

      // Unless Alt is pressed, adjust handle-out collinearly (smooth point)
      if (!event.modifiers.alt && !this.targetSegment.handleOut.isZero()) {
        const outLength = this.targetSegment.handleOut.length;
        this.targetSegment.handleOut = newHandleIn.normalize().multiply(-outLength);
      }
      this.editor.selectionManager.updateSelection();
    } else if (this.dragMode === 'handle-out') {
      // Adjust handle-out
      const newHandleOut = event.point.subtract(this.targetSegment.point);
      this.targetSegment.handleOut = newHandleOut;

      // Unless Alt is pressed, adjust handle-in collinearly (smooth point)
      if (!event.modifiers.alt && !this.targetSegment.handleIn.isZero()) {
        const inLength = this.targetSegment.handleIn.length;
        this.targetSegment.handleIn = newHandleOut.normalize().multiply(-inLength);
      }
      this.editor.selectionManager.updateSelection();
    }
  }

  public override onMouseUp(event: paper.ToolEvent): void {
    if (this.dragMode !== 'none') {
      this.editor.history.pushState();
    }
    this.dragMode = 'none';
  }
}
