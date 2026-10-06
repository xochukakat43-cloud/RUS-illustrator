import paper from 'paper';
import type { ArtboardConfig } from '../types';

export interface ProjectData {
  version: string;
  artboard: ArtboardConfig;
  layerData: string;
}

export class Serializer {
  public static serialize(artboard: ArtboardConfig, mainLayer: paper.Layer): string {
    const data: ProjectData = {
      version: '1.0.0',
      artboard,
      layerData: mainLayer.exportJSON({ asString: true }) as string
    };
    return JSON.stringify(data, null, 2);
  }

  public static deserialize(
    jsonString: string,
    scope: paper.PaperScope,
    mainLayer: paper.Layer
  ): { artboard: ArtboardConfig } {
    const data: ProjectData = JSON.parse(jsonString);

    mainLayer.removeChildren();
    if (data.layerData) {
      mainLayer.importJSON(data.layerData);
    }

    return { artboard: data.artboard };
  }

  public static importSVG(svgString: string, scope: paper.PaperScope, mainLayer: paper.Layer): paper.Item | null {
    try {
      const item = mainLayer.importSVG(svgString, {
        expandShapes: true,
        applyMatrix: true
      });
      if (item) {
        item.selected = true;
        return item;
      }
    } catch (e) {
      console.error('Failed to import SVG:', e);
    }
    return null;
  }
}
