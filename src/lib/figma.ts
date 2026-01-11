/**
 * Figma API Integration
 * 
 * Gebruikt Figma REST API om designs op te halen en te gebruiken in de applicatie.
 * 
 * @see https://www.figma.com/developers/api
 */

const FIGMA_API_BASE = 'https://api.figma.com/v1';

export interface FigmaConfig {
  accessToken: string;
  fileKey: string;
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
}

export interface FigmaFile {
  document: FigmaNode;
  styles: Record<string, unknown>;
  components: Record<string, unknown>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  opacity?: number;
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
}

/**
 * Haal een Figma file op via de API
 */
export async function getFigmaFile(
  fileKey: string,
  accessToken: string
): Promise<FigmaFile> {
  const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
    headers: {
      'X-Figma-Token': accessToken,
    },
    next: { revalidate: 3600 }, // Cache voor 1 uur
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Figma API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
}

/**
 * Haal een specifieke node op (frame, component, etc.)
 */
export async function getFigmaNode(
  fileKey: string,
  nodeId: string,
  accessToken: string
): Promise<FigmaNode> {
  const response = await fetch(
    `${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${nodeId}`,
    {
      headers: {
        'X-Figma-Token': accessToken,
      },
      next: { revalidate: 3600 }, // Cache voor 1 uur
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Figma API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  const node = data.nodes[nodeId]?.document;

  if (!node) {
    throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
  }

  return node;
}

/**
 * Haal een image render op van een node
 */
export async function getFigmaImage(
  fileKey: string,
  nodeId: string,
  accessToken: string,
  options?: {
    format?: 'png' | 'svg' | 'pdf' | 'jpg';
    scale?: number;
  }
): Promise<string> {
  const format = options?.format || 'png';
  const scale = options?.scale || 2;

  const response = await fetch(
    `${FIGMA_API_BASE}/images/${fileKey}?ids=${nodeId}&format=${format}&scale=${scale}`,
    {
      headers: {
        'X-Figma-Token': accessToken,
      },
      next: { revalidate: 1800 }, // Cache voor 30 minuten (images veranderen vaker)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Figma API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  const imageUrl = data.images[nodeId];

  if (!imageUrl) {
    throw new Error(`Image for node ${nodeId} not found`);
  }

  return imageUrl;
}

/**
 * Parse een Figma URL naar fileKey en nodeId
 * 
 * Ondersteunt beide formaten:
 * - Oud: https://www.figma.com/file/{fileKey}/{name}?node-id={nodeId}
 * - Nieuw: https://www.figma.com/design/{fileKey}/{name}?node-id={nodeId}
 * 
 * @example
 * parseFigmaUrl('https://www.figma.com/file/abc123/Design?node-id=1%3A2')
 * // Returns: { fileKey: 'abc123', nodeId: '1:2' }
 * 
 * @example
 * parseFigmaUrl('https://www.figma.com/design/abc123/Design?node-id=185-594')
 * // Returns: { fileKey: 'abc123', nodeId: '185-594' }
 */
export function parseFigmaUrl(url: string): {
  fileKey: string;
  nodeId: string | null;
} | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Ondersteun zowel 'file' als 'design' formaten
    const fileKeyIndex = pathParts.indexOf('file');
    const designKeyIndex = pathParts.indexOf('design');
    const keyIndex = fileKeyIndex !== -1 ? fileKeyIndex : designKeyIndex;

    if (keyIndex === -1 || keyIndex + 1 >= pathParts.length) {
      return null;
    }

    const fileKey = pathParts[keyIndex + 1];
    const nodeId = urlObj.searchParams.get('node-id');

    if (!fileKey) {
      return null;
    }

    // Decode node-id (kan encoded zijn als 1%3A2 voor 1:2)
    // Ook ondersteunen voor node-id formaten zoals 185-594 (Figma gebruikt soms - in plaats van :)
    const decodedNodeId = nodeId ? decodeURIComponent(nodeId) : null;

    return { fileKey, nodeId: decodedNodeId };
  } catch {
    return null;
  }
}

/**
 * Haal alle componenten uit een Figma file op
 */
export async function getFigmaComponents(
  fileKey: string,
  accessToken: string
): Promise<Record<string, unknown>> {
  const file = await getFigmaFile(fileKey, accessToken);
  return file.components || {};
}

/**
 * Zoek nodes in een Figma file op naam
 */
export function findNodesByName(
  node: FigmaNode,
  name: string,
  exact: boolean = false
): FigmaNode[] {
  const results: FigmaNode[] = [];

  const matches = exact
    ? node.name === name
    : node.name.toLowerCase().includes(name.toLowerCase());

  if (matches) {
    results.push(node);
  }

  if (node.children) {
    for (const child of node.children) {
      results.push(...findNodesByName(child, name, exact));
    }
  }

  return results;
}

/**
 * Converteer Figma RGB color naar CSS hex
 */
export function figmaColorToHex(color: {
  r: number;
  g: number;
  b: number;
  a?: number;
}): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? color.a : 1;

  if (a < 1) {
    const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alpha}`;
  }

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

