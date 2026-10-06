import type paper from 'paper';
import type { ArtboardConfig } from '../types';
import { Serializer } from './Serializer';

const STORAGE_KEY = 'vector_studio_autosave_v1';

export class LocalStore {
  private static saveTimeout: number | null = null;

  public static scheduleAutoSave(artboard: ArtboardConfig, mainLayer: paper.Layer): void {
    if (this.saveTimeout) {
      window.clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = window.setTimeout(() => {
      try {
        const json = Serializer.serialize(artboard, mainLayer);
        localStorage.setItem(STORAGE_KEY, json);
      } catch (err) {
        console.warn('Auto-save to localStorage failed (possibly storage limit reached):', err);
      }
    }, 1000);
  }

  public static loadAutoSave(
    scope: paper.PaperScope,
    mainLayer: paper.Layer
  ): { artboard: ArtboardConfig } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return Serializer.deserialize(data, scope, mainLayer);
    } catch (e) {
      console.warn('Failed to restore auto-save:', e);
      return null;
    }
  }

  public static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
