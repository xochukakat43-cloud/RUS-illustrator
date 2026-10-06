export type ToolType = 
  | 'select' 
  | 'direct-select' 
  | 'pen' 
  | 'rectangle' 
  | 'ellipse' 
  | 'line' 
  | 'pan' 
  | 'zoom';

export interface ArtboardConfig {
  width: number;
  height: number;
  backgroundColor: string;
  name: string;
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ActiveStyle {
  fillColor: string | null;     // null = none / transparent
  strokeColor: string | null;   // null = none
  strokeWidth: number;
  strokeCap: 'butt' | 'round' | 'square';
  strokeJoin: 'miter' | 'round' | 'bevel';
  opacity: number;
}

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface SelectionInfo {
  count: number;
  bounds: SelectionBounds | null;
  fillColor: string | null;
  strokeColor: string | null;
  strokeWidth: number | null;
  opacity: number | null;
  isPath: boolean;
  isGroup: boolean;
}

export interface DirectSelectionInfo {
  selectedSegmentCount: number;
  isSmooth: boolean | null;
}

export interface LayerNode {
  id: number;
  name: string;
  type: 'path' | 'compound-path' | 'group' | 'shape';
  visible: boolean;
  locked: boolean;
  selected: boolean;
  children?: LayerNode[];
}

export type AlignMode = 'selection' | 'artboard';

export type AlignType = 
  | 'left' 
  | 'horizontalCenter' 
  | 'right' 
  | 'top' 
  | 'verticalCenter' 
  | 'bottom'
  | 'distributeHorizontally'
  | 'distributeVertically';

export type PathfinderOp = 'unite' | 'subtract' | 'intersect' | 'exclude';
