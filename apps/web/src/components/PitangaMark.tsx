/**
 * Pitanga Mark Logo
 * - Refined leaf geometry with subtle stem
 * - Berries with characteristic 8-ribbed profile suggestion
 * - Balanced, architectural composition for a formal corporate feel
 */
export const PitangaMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Central Stem - Very subtle anchor */}
    <path d="M16 11V14" stroke="#768153" strokeWidth="0.75" strokeLinecap="round" />
    
    {/* Refined Leaves - More fluid, organic yet structured */}
    <path 
      d="M16 11.5C16 11.5 15.2 7 12.5 7C9.8 7 9.5 9.5 9.5 10C9.5 10.5 9.8 13.5 13 13.5C15.2 13.5 16 11.5 16 11.5Z" 
      fill="#768153" 
    />
    <path 
      d="M16 11.5C16 11.5 16.8 7 19.5 7C22.2 7 22.5 9.5 22.5 10C22.5 10.5 22.2 13.5 19 13.5C16.8 13.5 16 11.5 16 11.5Z" 
      fill="#768153" 
      fillOpacity="0.85" 
    />
    
    {/* Berries - Geometric abstraction of the 8-ribbed Pitanga fruit */}
    {/* Left Berry */}
    <g>
      <circle cx="11.5" cy="18.5" r="3.8" fill="#8B261E" />
      <path d="M11.5 15.5V17.5" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
      <path d="M9.5 18.5H10.5" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
    </g>
    
    {/* Right Berry */}
    <g>
      <circle cx="20.5" cy="18.5" r="3.8" fill="#8B261E" />
      <path d="M20.5 15.5V17.5" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
      <path d="M21.5 18.5H22.5" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
    </g>
    
    {/* Center Berry (Foreground) */}
    <g>
      <circle cx="16" cy="23.8" r="4.2" fill="#8B261E" />
      <circle cx="16" cy="23.8" r="4.2" stroke="#FCFCFB" strokeWidth="0.5" />
      {/* Subtle ribbed detail */}
      <path d="M16 20.5V22" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
      <path d="M14 23.8H15" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
      <path d="M17 23.8H18" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
    </g>
  </svg>
);

export default PitangaMark;
