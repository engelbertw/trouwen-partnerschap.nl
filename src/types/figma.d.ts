/**
 * Figma API Types
 * 
 * TypeScript type definitions voor Figma REST API responses
 * 
 * @see https://www.figma.com/developers/api
 */

export interface FigmaFileResponse {
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  opacity?: number;
  blendMode?: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  styles?: Record<string, string>;
  characters?: string; // Voor TEXT nodes
  style?: FigmaTextStyle;
  characterStyleOverrides?: number[];
  layoutMode?: 'HORIZONTAL' | 'VERTICAL'; // Voor FRAME nodes
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks: Array<{
    uri: string;
  }>;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description: string;
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE';
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  opacity?: number;
  gradientStops?: Array<{
    position: number;
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  }>;
  imageRef?: string;
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
}

export interface FigmaStroke {
  type: 'SOLID' | 'GRADIENT_LINEAR';
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  opacity?: number;
  strokeWeight?: number;
  strokeAlign?: 'CENTER' | 'INSIDE' | 'OUTSIDE';
}

export interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible: boolean;
  radius: number;
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  offset?: {
    x: number;
    y: number;
  };
  spread?: number;
}

export interface FigmaTextStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  listOptions?: string;
  fontSize: number;
  fontWeight: number;
  textCase?: 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';
  textDecoration?: 'UNDERLINE' | 'STRIKETHROUGH';
  letterSpacing?: {
    value: number;
    unit: 'PIXELS' | 'PERCENT';
  };
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit?: 'PIXELS' | 'PERCENT' | 'AUTO';
}

export interface FigmaImageResponse {
  images: Record<string, string>; // nodeId -> imageUrl
  error?: boolean;
}

export interface FigmaNodesResponse {
  nodes: Record<string, {
    document: FigmaNode;
    components: Record<string, FigmaComponent>;
    styles: Record<string, FigmaStyle>;
    schemaVersion: number;
  }>;
}

