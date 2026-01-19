/**
 * Hidden page to store Pitanga logo options
 * Access at: /logo-options
 */
import { 
  PitangaLogoOriginal,
  PitangaLogoP1, PitangaLogoP2, PitangaLogoP3, PitangaLogoP4, 
  PitangaLogoP5, PitangaLogoP6, PitangaLogoP7,
} from "../components/PitangaMark";

export default function LogoOptions() {
  const logos = [
    { Logo: PitangaLogoOriginal, name: "Original", desc: "Current official logo", selected: true },
    { Logo: PitangaLogoP1, name: "P1", desc: "Abstract - two leaves, large cluster" },
    { Logo: PitangaLogoP2, name: "P2", desc: "Sleek - single leaf right" },
    { Logo: PitangaLogoP3, name: "P3", desc: "Pyramid - two leaves, tight" },
    { Logo: PitangaLogoP4, name: "P4", desc: "Ultra Min - tiny leaf" },
    { Logo: PitangaLogoP5, name: "P5", desc: "Balanced - with stem" },
    { Logo: PitangaLogoP6, name: "P6", desc: "Compact - small leaves" },
    { Logo: PitangaLogoP7, name: "P7", desc: "Cleanest - single elegant leaf" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Pitanga Logo Options
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Hidden reference page • Red berries (#a82c24) • Green leaves (#5a6e3a)
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {logos.map(({ Logo, name, desc, selected }) => (
              <div 
                key={name} 
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  selected 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {selected && (
                  <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                    ✓ Selected
                  </span>
                )}
                <div className="w-16 h-16 flex items-center justify-center bg-gray-900 rounded-lg">
                  <Logo className="w-12 h-12" />
                </div>
                <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg border border-gray-200">
                  <Logo className="w-12 h-12" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block">{name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Color Palette
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#5a6e3a' }} />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">#5a6e3a (Leaf)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#6b8044' }} />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">#6b8044 (Leaf Light)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#a82c24' }} />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">#a82c24 (Berry)</span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
            To change the logo, update PitangaMark export in src/components/PitangaMark.tsx
          </p>
        </div>
      </div>
    </div>
  );
}
