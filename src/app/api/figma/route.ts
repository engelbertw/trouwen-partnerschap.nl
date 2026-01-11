import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getFigmaFile,
  getFigmaNode,
  getFigmaImage,
  parseFigmaUrl,
  getFigmaComponents,
} from '@/lib/figma';

/**
 * GET /api/figma
 * 
 * Haal Figma design data op via de API
 * 
 * Query parameters:
 * - url: Figma URL (required) - Format: https://www.figma.com/file/{fileKey}/{name}?node-id={nodeId}
 * - action: Type van data om op te halen (optional)
 *   - 'file' (default): Volledige file
 *   - 'node': Specifieke node
 *   - 'image': Gerenderde image van node
 *   - 'components': Alle componenten in file
 * 
 * @example
 * GET /api/figma?url=https://www.figma.com/file/abc123/Design?node-id=1%3A2&action=image
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticatie check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const figmaUrl = searchParams.get('url');
    const action = searchParams.get('action') || 'file'; // 'file', 'node', 'image', 'components'

    if (!figmaUrl) {
      return NextResponse.json(
        { error: 'Figma URL is required. Use ?url=https://www.figma.com/file/...' },
        { status: 400 }
      );
    }

    // Parse URL
    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) {
      return NextResponse.json(
        {
          error: 'Invalid Figma URL format',
          expected: 'https://www.figma.com/file/{fileKey}/{name}?node-id={nodeId}',
          received: figmaUrl,
        },
        { status: 400 }
      );
    }

    const { fileKey, nodeId } = parsed;
    const accessToken = process.env.FIGMA_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('FIGMA_ACCESS_TOKEN not configured');
      return NextResponse.json(
        {
          error: 'Figma access token not configured',
          message: 'Please set FIGMA_ACCESS_TOKEN in environment variables',
        },
        { status: 500 }
      );
    }

    // Haal data op afhankelijk van action
    let data;
    switch (action) {
      case 'node':
        if (!nodeId) {
          return NextResponse.json(
            {
              error: 'Node ID required for node action',
              message: 'Add ?node-id=... to the Figma URL',
            },
            { status: 400 }
          );
        }
        data = await getFigmaNode(fileKey, nodeId, accessToken);
        break;

      case 'image':
        if (!nodeId) {
          return NextResponse.json(
            {
              error: 'Node ID required for image action',
              message: 'Add ?node-id=... to the Figma URL',
            },
            { status: 400 }
          );
        }
        const format = searchParams.get('format') as 'png' | 'svg' | 'pdf' | 'jpg' | null;
        const scale = searchParams.get('scale') ? parseInt(searchParams.get('scale')!) : undefined;
        const imageUrl = await getFigmaImage(fileKey, nodeId, accessToken, {
          format: format || 'png',
          scale: scale || 2,
        });
        return NextResponse.json({
          success: true,
          imageUrl,
          fileKey,
          nodeId,
        });

      case 'components':
        const components = await getFigmaComponents(fileKey, accessToken);
        return NextResponse.json({
          success: true,
          components,
          fileKey,
        });

      case 'file':
      default:
        data = await getFigmaFile(fileKey, accessToken);
        break;
    }

    return NextResponse.json({
      success: true,
      data,
      fileKey,
      nodeId: nodeId || null,
      action,
    });
  } catch (error) {
    console.error('Figma API error:', error);

    // Geef specifieke error messages terug
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return NextResponse.json(
          {
            error: 'Figma authentication failed',
            message: 'Invalid or expired access token',
            details: error.message,
          },
          { status: 401 }
        );
      }

      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Figma resource not found',
            message: 'File or node does not exist or is not accessible',
            details: error.message,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to fetch Figma data',
          message: error.message,
          details: error.stack,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch Figma data',
        message: 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

