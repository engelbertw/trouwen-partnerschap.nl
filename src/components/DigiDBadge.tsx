import type { JSX } from 'react';
import Image from 'next/image';

/**
 * DigiD Badge Component
 * Hergebruikt Figma component design met officieel DigiD logo
 * 
 * Figma source: https://www.figma.com/design/Gc3iud2ERhbOBKFfsidoq4/OPENcomponents?node-id=1374-57
 */
export function DigiDBadge(): JSX.Element {
  // Figma asset URLs (valid for 7 days)
  // In production, download these images and store them in public/images/digid/
  const imgDigiD = 'https://www.figma.com/api/mcp/asset/67a73617-67e6-4e4b-a7b1-fcd6885a4c45';
  const imgGroup = 'https://www.figma.com/api/mcp/asset/0056792b-11fc-4ba7-b114-950611b57b9b';

  return (
    <div className="relative inline-flex items-center justify-center" aria-label="DigiD">
      {/* Text-based badge matching Figma design: "Dig" in white, "iD" in orange */}
      <span className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded inline-flex items-center">
        <span className="text-white">Dig</span>
        <span className="text-orange-500">iD</span>
      </span>
    </div>
  );
}

