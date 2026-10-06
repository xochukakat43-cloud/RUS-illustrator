import type paper from 'paper';
import type { Editor } from '../Editor';
import type { ToolType } from '../types';

export abstract class Tool {
  protected editor: Editor;
  public abstract readonly type: ToolType;
  public abstract readonly cursor: string;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  public activate(): void {}
  public deactivate(): void {}

  public onMouseDown(event: paper.ToolEvent): void {}
  public onMouseDrag(event: paper.ToolEvent): void {}
  public onMouseUp(event: paper.ToolEvent): void {}
  public onMouseMove(event: paper.ToolEvent): void {}
  public onKeyDown(event: paper.KeyEvent): void {}
  public onKeyUp(event: paper.KeyEvent): void {}
}
