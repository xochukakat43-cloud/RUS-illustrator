export type ToolType = 
  | 'select' 
  | 'direct-select' 
  | 'pen' 
  | 'pencil'
  | 'eraser'
  | 'text'
  | 'eyedropper'
  | 'rectangle' 
  | 'ellipse' 
  | 'polygon'
  | 'star'
  | 'line' 
  | 'gradient'
  | 'pan' 
  | 'zoom';

export interface ArtboardConfig {
  width: number;
  height: number;
  backgroundColor: string;
  name: string;
}

export interface GridConfig {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface ManualGuide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  coord: number;
}

export interface GuidesConfig {
  showRulers: boolean;
  showGuides: boolean;
  lockGuides: boolean;
  smartGuides: boolean;
  snapToGuides: boolean;
}


export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface GradientStop {
  color: string;
  offset: number; // 0 to 1
}

export interface GradientDef {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  origin?: { x: number; y: number };
  destination?: { x: number; y: number };
}

export interface ActiveStyle {
  fillColor: string | null;     // null = none / transparent
  strokeColor: string | null;   // null = none
  strokeWidth: number;
  strokeCap: 'butt' | 'round' | 'square';
  strokeJoin: 'miter' | 'round' | 'bevel';
  dashArray?: number[];
  opacity: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  gradient?: GradientDef | null;
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
  dashArray: number[] | null;
  opacity: number | null;
  isPath: boolean;
  isGroup: boolean;
  isText: boolean;
  cornerRadius?: number;
  textContent?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  gradient?: GradientDef | null;
}

export interface DirectSelectionInfo {
  selectedSegmentCount: number;
  isSmooth: boolean | null;
}

export interface LayerNode {
  id: number;
  name: string;
  type: 'path' | 'compound-path' | 'group' | 'shape' | 'text';
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
