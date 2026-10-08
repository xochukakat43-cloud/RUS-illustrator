import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

export class EyedropperTool extends Tool {
  public readonly type: ToolType = 'eyedropper';
  public readonly cursor: string = 'crosshair';

  public override onMouseDown(event: paper.ToolEvent): void {
    const zoom = this.editor.viewport.getZoom();
    const hitOptions = {
      fill: true,
      stroke: true,
      tolerance: 6 / zoom,
    };

    const hitResult = this.editor.getMainLayer().hitTest(event.point, hitOptions);

    if (hitResult && hitResult.item) {
      const item = hitResult.item;

      const fillColor = item.fillColor ? item.fillColor.toCSS(true) : null;
      const strokeColor = item.strokeColor ? item.strokeColor.toCSS(true) : null;
      const strokeWidth = item.strokeWidth || 0;
      const opacity = item.opacity ?? 1;

      // Update active style in editor
      this.editor.setActiveStyle({
        fillColor,
        strokeColor,
        strokeWidth: strokeWidth || 1,
        opacity,
      });

      // If items are currently selected, apply sampled styles directly
      const selected = this.editor.selectionManager.getSelectedItems();
      if (selected.length > 0) {
        selected.forEach((selItem) => {
          selItem.fillColor = fillColor ? new paper.Color(fillColor) : null as any;
          selItem.strokeColor = strokeColor ? new paper.Color(strokeColor) : null as any;
          selItem.strokeWidth = strokeWidth;
          selItem.opacity = opacity;
        });
        this.editor.selectionManager.updateSelection();
        this.editor.history.pushState();
      }
    }
  }
}
