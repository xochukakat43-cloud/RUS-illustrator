import paper from 'paper';
import type { ArtboardConfig } from '../types';

export interface ProjectData {
  version: string;
  artboard?: ArtboardConfig;
  artboards?: ArtboardConfig[];
  activeArtboardIndex?: number;
  layerData: string;
}

export class Serializer {
  public static serialize(
    artboard: ArtboardConfig,
    mainLayer: paper.Layer,
    artboards?: ArtboardConfig[],
    activeArtboardIndex?: number
  ): string {
    const data: ProjectData = {
      version: '1.1.0',
      artboard,
      artboards: artboards || [artboard],
      activeArtboardIndex: activeArtboardIndex ?? 0,
      layerData: mainLayer.exportJSON({ asString: true }) as string,
    };
    return JSON.stringify(data, null, 2);
  }

  public static deserialize(
    jsonString: string,
    _scope: paper.PaperScope,
    mainLayer: paper.Layer
  ): { artboard: ArtboardConfig; artboards: ArtboardConfig[]; activeArtboardIndex: number } {
    const data: ProjectData = JSON.parse(jsonString);

    mainLayer.removeChildren();
    if (data.layerData) {
      mainLayer.importJSON(data.layerData);
    }

    const artboards = data.artboards && data.artboards.length > 0
      ? data.artboards
      : data.artboard
      ? [data.artboard]
      : [
          {
            id: 'artboard-1',
            x: 0,
            y: 0,
            width: 1200,
            height: 800,
            backgroundColor: '#ffffff',
            name: 'Артборд 1',
          },
        ];

    const activeArtboardIndex = data.activeArtboardIndex ?? 0;
    const artboard = artboards[activeArtboardIndex] || artboards[0];

    return { artboard, artboards, activeArtboardIndex };
  }

  public static importSVG(svgString: string, _scope: paper.PaperScope, mainLayer: paper.Layer): paper.Item | null {
    try {
      const item = mainLayer.importSVG(svgString, {
        expandShapes: true,
        applyMatrix: true,
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
