import { Upload, Star, RefreshCw, Sparkles } from "lucide-react";
import type { Logo } from "../types/logo";

interface LogoCardProps {
  logo: Logo;
  index: number;
  onClick: () => void;
  onToggleFavorite: () => void;
  onGenerate?: () => void;
}

export function LogoCard({
  logo,
  index,
  onClick,
  onToggleFavorite,
  onGenerate,
}: LogoCardProps) {
  const hasImage = Boolean(logo.imageData);

  return (
    <div
      className={`relative group rounded-xl border-2 transition-all duration-300 overflow-hidden ${
        logo.isFavorite
          ? "border-yellow-400 shadow-lg shadow-yellow-400/20"
          : "border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500"
      } cursor-pointer hover:scale-105`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:scale-110 transition-transform"
        aria-label={
          logo.isFavorite ? "Remove from favorites" : "Add to favorites"
        }
      >
        <Star
          className={`w-5 h-5 ${
            logo.isFavorite
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-400"
          }`}
        />
      </button>
      {onGenerate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGenerate();
          }}
          className="absolute top-2 left-2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:scale-110 transition-transform"
          aria-label="Generate logo with AI"
          title="Generate logo with AI"
        >
          <Sparkles className="w-5 h-5 text-primary-500" />
        </button>
      )}

      {/* Logo display area */}
      <div
        onClick={onClick}
        className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-6 cursor-pointer"
      >
        {hasImage ? (
          <div className="relative w-full h-full">
            <img
              src={logo.imageData}
              alt={`Logo ${index + 1}`}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Click to replace</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Slot {index + 1}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Empty
            </p>
          </div>
        )}
      </div>
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Logo {index + 1}
          </span>
          {logo.generation > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              Gen {logo.generation}
            </span>
          )}
        </div>
        <p
          className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2"
          title={logo.prompt}
        >
          {logo.prompt}
        </p>
        {logo.metadata.model && logo.metadata.model !== "manual" && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">
            {logo.metadata.model}
          </p>
        )}
      </div>
    </div>
  );
}
