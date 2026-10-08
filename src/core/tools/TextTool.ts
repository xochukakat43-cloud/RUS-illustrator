import paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

export class TextTool extends Tool {
  public readonly type: ToolType = 'text';
  public readonly cursor: string = 'text';

  public override onMouseDown(event: paper.ToolEvent): void {
    const zoom = this.editor.viewport.getZoom();
    const hitOptions = {
      fill: true,
      stroke: true,
      bounds: true,
      tolerance: 8 / zoom,
    };

    const hitResult = this.editor.getMainLayer().hitTest(event.point, hitOptions);

    if (hitResult && hitResult.item instanceof paper.PointText) {
      // Clicked on existing text item: select it
      this.editor.selectionManager.clearSelection();
      hitResult.item.selected = true;
      this.editor.selectionManager.updateSelection();
      return;
    }

    // Clicked on empty space: create new text item
    this.editor.selectionManager.clearSelection();
    const style = this.editor.getActiveStyle();

    const textItem = new paper.PointText({
      point: event.point,
      content: 'Текст',
      fillColor: style.fillColor ? new paper.Color(style.fillColor) : new paper.Color('#000000'),
      fontFamily: style.fontFamily || 'Inter, sans-serif',
      fontSize: style.fontSize || 36,
      fontWeight: style.fontWeight || 'normal',
      opacity: style.opacity ?? 1,
    });

    this.editor.getMainLayer().addChild(textItem);
    textItem.selected = true;
    this.editor.selectionManager.updateSelection();
    this.editor.history.pushState();
  }
}
