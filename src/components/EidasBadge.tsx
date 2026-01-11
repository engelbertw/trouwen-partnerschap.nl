import type { JSX } from 'react';
import Image from 'next/image';

/**
 * eIDAS Badge Component
 * Hergebruikt Figma component design met officieel eIDAS logo
 * 
 * Figma source: https://www.figma.com/design/Gc3iud2ERhbOBKFfsidoq4/OPENcomponents?node-id=35-165
 */
export function EidasBadge(): JSX.Element {
  return (
    <div className="relative inline-flex items-center justify-center w-8 h-8" aria-label="eIDAS">
      {/* eIDAS icon: Blue circle with official eIDAS logo */}
      <div className="relative w-8 h-8 bg-[#003399] rounded-full flex items-center justify-center overflow-hidden">
        {/* Official eIDAS logo as image */}
        <Image
          src="/images/eidas/eidas-logo.svg"
          alt="eIDAS"
          width={20}
          height={20}
          className="w-5 h-5"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

