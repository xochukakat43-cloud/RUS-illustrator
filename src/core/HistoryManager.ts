import type paper from 'paper';

export class HistoryManager {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxDepth: number = 60;
  private isApplying: boolean = false;
  private getMainLayer: () => paper.Layer | null;
  private onStateChange: () => void;

  constructor(getMainLayer: () => paper.Layer | null, onStateChange: () => void) {
    this.getMainLayer = getMainLayer;
    this.onStateChange = onStateChange;
  }

  public pushState(): void {
    if (this.isApplying) return;

    const layer = this.getMainLayer();
    if (!layer) return;

    // Export main layer content to JSON
    const snapshot = layer.exportJSON({ asString: true }) as string;

    // Don't duplicate if identical to last state
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === snapshot) {
      return;
    }

    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }

    // New action invalidates redo stack
    this.redoStack = [];
    this.onStateChange();
  }

  public undo(): boolean {
    if (this.undoStack.length <= 1) return false; // Keep initial empty state

    const currentState = this.undoStack.pop();
    if (!currentState) return false;

    this.redoStack.push(currentState);
    const previousState = this.undoStack[this.undoStack.length - 1];

    this.applyState(previousState);
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;

    const stateToRestore = this.redoStack.pop();
    if (!stateToRestore) return false;

    this.undoStack.push(stateToRestore);
    this.applyState(stateToRestore);
    return true;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.onStateChange();
  }

  private applyState(jsonSnapshot: string): void {
    const layer = this.getMainLayer();
    if (!layer) return;

    this.isApplying = true;
    try {
      layer.removeChildren();
      layer.importJSON(jsonSnapshot);
    } catch (e) {
      console.error('Failed to apply history state:', e);
    } finally {
      this.isApplying = false;
      this.onStateChange();
    }
  }
}
