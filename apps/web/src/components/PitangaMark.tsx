/**
 * Pitanga Logo
 * Official mark + alternatives stored for reference
 */

// Color palette
const LEAF = "#5a6e3a";
const LEAF_LIGHT = "#6b8044";
const BERRY = "#a82c24";

// ORIGINAL - The official logo (from pitanga-website)
export const PitangaLogoOriginal = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 11V14" stroke={LEAF} strokeWidth="0.75" strokeLinecap="round" />
    <path d="M16 11.5C16 11.5 15.2 7 12.5 7C9.8 7 9.5 9.5 9.5 10C9.5 10.5 9.8 13.5 13 13.5C15.2 13.5 16 11.5 16 11.5Z" fill={LEAF} />
    <path d="M16 11.5C16 11.5 16.8 7 19.5 7C22.2 7 22.5 9.5 22.5 10C22.5 10.5 22.2 13.5 19 13.5C16.8 13.5 16 11.5 16 11.5Z" fill={LEAF_LIGHT} fillOpacity="0.85" />
    <circle cx="11.5" cy="18.5" r="3.8" fill={BERRY} />
    <circle cx="20.5" cy="18.5" r="3.8" fill={BERRY} />
    <circle cx="16" cy="23.8" r="4.2" fill={BERRY} />
  </svg>
);

// P1: Abstract - two leaves, large overlapping cluster
export const PitangaLogoP1 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 6C16 6 12 4 9 6C6 8 8 11 11 11C14 11 16 8 16 6Z" fill={LEAF} fillOpacity="0.8" />
    <path d="M16 6C16 6 20 4 23 6C26 8 24 11 21 11C18 11 16 8 16 6Z" fill={LEAF_LIGHT} fillOpacity="0.65" />
    <ellipse cx="12" cy="17" rx="5.5" ry="6" fill={BERRY} fillOpacity="0.75" />
    <ellipse cx="20" cy="17" rx="5.5" ry="6" fill={BERRY} fillOpacity="0.75" />
    <ellipse cx="16" cy="22" rx="6" ry="6.5" fill={BERRY} />
  </svg>
);

// P2: Sleek - single leaf, clean cluster
export const PitangaLogoP2 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 8C16 8 18.5 5 21 6C23 7 22 9.5 20 10C18 10.5 16 9 16 8Z" fill={LEAF} fillOpacity="0.85" />
    <ellipse cx="13" cy="17" rx="5" ry="5.5" fill={BERRY} fillOpacity="0.7" />
    <ellipse cx="19" cy="17" rx="5" ry="5.5" fill={BERRY} fillOpacity="0.7" />
    <ellipse cx="16" cy="21.5" rx="5.5" ry="6" fill={BERRY} />
  </svg>
);

// P3: Pyramid - two leaves, tight pyramid cluster
export const PitangaLogoP3 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 7C16 7 13 4 10 5.5C7 7 8 10 11 10C14 10 16 8 16 7Z" fill={LEAF} fillOpacity="0.85" />
    <path d="M16 7C16 7 19 4 22 5.5C25 7 24 10 21 10C18 10 16 8 16 7Z" fill={LEAF_LIGHT} fillOpacity="0.7" />
    <ellipse cx="13" cy="16" rx="5" ry="5" fill={BERRY} fillOpacity="0.75" />
    <ellipse cx="19" cy="16" rx="5" ry="5" fill={BERRY} fillOpacity="0.75" />
    <ellipse cx="16" cy="21" rx="6" ry="6" fill={BERRY} />
  </svg>
);

// P4: Ultra Minimal - tiny leaf accent
export const PitangaLogoP4 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 10C16 10 18 7 20 8C21.5 9 20.5 11 19 11C17.5 11 16 10.5 16 10Z" fill={LEAF} />
    <circle cx="12.5" cy="17" r="4.5" fill={BERRY} fillOpacity="0.6" />
    <circle cx="19.5" cy="17" r="4.5" fill={BERRY} fillOpacity="0.6" />
    <circle cx="16" cy="22" r="5" fill={BERRY} />
  </svg>
);

// P5: Balanced - with stem hint
export const PitangaLogoP5 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 8V11" stroke={LEAF} strokeWidth="1" strokeLinecap="round" />
    <path d="M16 9C16 9 13 6 10.5 7C8 8 9 10.5 11.5 10.5C14 10.5 16 9 16 9Z" fill={LEAF} fillOpacity="0.8" />
    <path d="M16 9C16 9 19 6 21.5 7C24 8 23 10.5 20.5 10.5C18 10.5 16 9 16 9Z" fill={LEAF_LIGHT} fillOpacity="0.65" />
    <ellipse cx="12.5" cy="17.5" rx="5" ry="5.5" fill={BERRY} fillOpacity="0.7" />
    <ellipse cx="19.5" cy="17.5" rx="5" ry="5.5" fill={BERRY} fillOpacity="0.7" />
    <ellipse cx="16" cy="22.5" rx="5.5" ry="6" fill={BERRY} />
  </svg>
);

// P6: Compact - small leaves, tight cluster
export const PitangaLogoP6 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 9C16 9 14 6.5 12 7C10 7.5 10 9.5 11.5 10C13 10.5 16 9 16 9Z" fill={LEAF} fillOpacity="0.85" />
    <path d="M16 9C16 9 18 6.5 20 7C22 7.5 22 9.5 20.5 10C19 10.5 16 9 16 9Z" fill={LEAF_LIGHT} fillOpacity="0.7" />
    <circle cx="13" cy="16.5" r="4.5" fill={BERRY} fillOpacity="0.7" />
    <circle cx="19" cy="16.5" r="4.5" fill={BERRY} fillOpacity="0.7" />
    <circle cx="16" cy="21.5" r="5" fill={BERRY} />
  </svg>
);

// P7: Cleanest - single elegant leaf
export const PitangaLogoP7 = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 8C16 8 19 5 22 6.5C24 8 22.5 10.5 20 10.5C17.5 10.5 16 9 16 8Z" fill={LEAF} />
    <ellipse cx="13" cy="17" rx="5" ry="5.5" fill={BERRY} fillOpacity="0.65" />
    <ellipse cx="19" cy="17" rx="5" ry="5.5" fill={BERRY} fillOpacity="0.65" />
    <ellipse cx="16" cy="22" rx="5.5" ry="6" fill={BERRY} />
  </svg>
);

// THE OFFICIAL LOGO - using the original
export const PitangaMark = PitangaLogoOriginal;

export default PitangaMark;
