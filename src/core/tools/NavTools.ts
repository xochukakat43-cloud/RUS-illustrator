import type paper from 'paper';
import { Tool } from './Tool';
import type { ToolType } from '../types';

export class PanTool extends Tool {
  public readonly type: ToolType = 'pan';
  public readonly cursor: string = 'grab';

  public override onMouseDrag(event: paper.ToolEvent): void {
    this.editor.viewport.pan(event.delta, false);
  }
}

export class ZoomTool extends Tool {
  public readonly type: ToolType = 'zoom';
  public readonly cursor: string = 'zoom-in';

  public override onMouseDown(event: paper.ToolEvent): void {
    const isAlt = event.modifiers.alt || event.modifiers.option;
    if (isAlt) {
      this.editor.viewport.setZoom(this.editor.viewport.getZoom() / 1.5, event.point);
    } else {
      this.editor.viewport.setZoom(this.editor.viewport.getZoom() * 1.5, event.point);
    }
  }
}
