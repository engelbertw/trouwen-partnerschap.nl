/**
 * Gemeente Amsterdam Logo Component
 * 
 * Toont het officiële Gemeente Amsterdam logo met drie rode X'en
 * en "Gemeente Amsterdam" tekst
 */
export function GemeenteLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Drie rode X'en verticaal gestapeld */}
      <div className="flex flex-col gap-0.5">
        <svg
          className="w-4 h-4 text-[#E60000]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg
          className="w-4 h-4 text-[#E60000]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg
          className="w-4 h-4 text-[#E60000]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      
      {/* Gemeente Amsterdam tekst */}
      <div className="flex flex-col leading-tight">
        <span className="text-[#E60000] font-bold text-sm">Gemeente</span>
        <span className="text-[#E60000] font-bold text-sm">Amsterdam</span>
      </div>
    </div>
  );
}

/**
 * Compacte versie voor headers (kleinere versie voor donkere achtergronden)
 */
export function GemeenteLogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Drie rode X'en verticaal gestapeld */}
      <div className="flex flex-col gap-0.5">
        <svg
          className="w-3.5 h-3.5 text-[#E60000]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg
          className="w-3.5 h-3.5 text-[#E60000]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg
          className="w-3.5 h-3.5 text-[#E60000]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      
      {/* Gemeente Amsterdam DEMO tekst */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col leading-tight">
          <span className="text-[#E60000] font-bold text-xs">Gemeente</span>
          <span className="text-[#E60000] font-bold text-xs">Amsterdam</span>
        </div>
        <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">DEMO</span>
      </div>
    </div>
  );
}

