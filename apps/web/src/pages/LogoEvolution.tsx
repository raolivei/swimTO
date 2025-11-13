import { useState, useEffect, useRef } from "react";
import { Download, Upload as UploadIcon, Trash2, Palette } from "lucide-react";
import { useLogoEvolution } from "../hooks/useLogoEvolution";
import { LogoCard } from "../components/LogoCard";
import { LogoUploader } from "../components/LogoUploader";
import { LogoGenerationModal } from "../components/LogoGenerationModal";
import { seedLogos } from "../data/seedLogos";
import { analyzeLogo } from "../lib/themeExtractor";
import type { Logo } from "../types/logo";
import type { GeneratedLogo } from "../lib/api";

export default function LogoEvolution() {
  const {
    logos,
    isLoading,
    initializeLogos,
    replaceLogo,
    toggleFavorite,
    getFavorites,
    exportLogos,
    importLogos,
    clearAll,
  } = useLogoEvolution();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasInitialized.current) {
      if (logos.length === 0) {
        hasInitialized.current = true;
        initializeLogos(seedLogos);
      } else {
        hasInitialized.current = true;
      }
    }
  }, [isLoading]);

  const handleLogoClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleImageSelected = async (imageData: string, source: string) => {
    if (selectedIndex === null) return;

    const currentLogo = logos[selectedIndex];
    replaceLogo(selectedIndex, {
      imageData,
      prompt: currentLogo.prompt,
      model:
        source === "file" || source === "paste" || source === "url"
          ? "manual"
          : undefined,
      iterationNotes: `Uploaded via ${source}`,
    });
    setAnalyzing(true);
    try {
      const analysis = await analyzeLogo(imageData);
      setAnalysisResult(analysis);
    } catch (error) {
      console.error("Failed to analyze logo:", error);
    } finally {
      setAnalyzing(false);
    }

    setSelectedIndex(null);
  };

  const handleGenerateClick = (index: number) => {
    setGeneratingIndex(index);
  };

  const handleGeneratedLogoSelect = async (generatedLogo: GeneratedLogo) => {
    if (generatingIndex === null) return;

    const currentLogo = logos[generatingIndex];
    replaceLogo(generatingIndex, {
      imageData: generatedLogo.image_data,
      prompt: currentLogo.prompt,
      model: generatedLogo.model as Logo["metadata"]["model"],
      iterationNotes: `Generated with ${generatedLogo.model}`,
    });
    setAnalyzing(true);
    try {
      const analysis = await analyzeLogo(generatedLogo.image_data);
      setAnalysisResult(analysis);
    } catch (error) {
      console.error("Failed to analyze logo:", error);
    } finally {
      setAnalyzing(false);
    }

    setGeneratingIndex(null);
  };

  const handleExport = () => {
    const data = exportLogos();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swimto-logos-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      if (importLogos(text)) {
        alert("Logos imported successfully!");
      } else {
        alert("Failed to import logos");
      }
    };
    input.click();
  };

  const favorites = getFavorites();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading logo studio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Logo Evolution Studio
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create and evolve logo designs for SwimTO
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                title="Import logos"
              >
                <UploadIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                title="Export logos"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear all logos?")) {
                    clearAll();
                  }
                }}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors flex items-center gap-2"
                title="Clear all"
              >
                <Trash2 className="w-5 h-5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
          <div className="mt-6 flex gap-4 text-sm">
            <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <span className="text-gray-600 dark:text-gray-400">Total: </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {logos.filter((l) => l.imageData).length} / {logos.length}
              </span>
            </div>
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-sm">
              <span className="text-yellow-700 dark:text-yellow-400">
                Favorites:{" "}
              </span>
              <span className="font-semibold text-yellow-900 dark:text-yellow-300">
                {favorites.length}
              </span>
            </div>
          </div>
        </div>
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-3">
            <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How to Use
              </h3>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Each card shows a logo slot with a suggested prompt</li>
                <li>
                  Click the sparkle icon (✨) to generate a logo using AI, or click the card to upload manually
                </li>
                <li>
                  Choose between DALL-E 3 or Leonardo.ai models for generation
                </li>
                <li>Upload via file, paste from clipboard, or load from URL</li>
                <li>Star your favorites for easy identification</li>
                <li>Export your collection or import previous work</li>
              </ol>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {logos.map((logo, index) => (
            <LogoCard
              key={logo.id}
              logo={logo}
              index={index}
              onClick={() => handleLogoClick(index)}
              onToggleFavorite={() => toggleFavorite(index)}
              onGenerate={() => handleGenerateClick(index)}
            />
          ))}
        </div>
        {favorites.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              ⭐ Your Favorites
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favorites.map((logo, idx) => (
                <div
                  key={logo.id}
                  className="aspect-square rounded-lg overflow-hidden border-2 border-yellow-400 shadow-lg"
                >
                  <img
                    src={logo.imageData}
                    alt={`Favorite ${idx + 1}`}
                    className="w-full h-full object-contain bg-white dark:bg-gray-800"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {analysisResult && (
          <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">
              Theme Analysis Complete
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Extracted Colors:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {analysisResult.colors.dominant.map(
                    (color: string, i: number) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-lg border-2 border-white dark:border-gray-700 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    )
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Shape Analysis:
                </p>
                <ul className="text-green-700 dark:text-green-300 space-y-1">
                  <li>
                    Circularity:{" "}
                    {(analysisResult.shapes.circularity * 100).toFixed(0)}%
                  </li>
                  <li>
                    Complexity:{" "}
                    {(analysisResult.shapes.complexity * 100).toFixed(0)}%
                  </li>
                  <li>
                    Density: {(analysisResult.shapes.density * 100).toFixed(0)}%
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedIndex !== null && (
        <LogoUploader
          onImageSelected={handleImageSelected}
          onClose={() => setSelectedIndex(null)}
          currentPrompt={logos[selectedIndex].prompt}
        />
      )}
      {generatingIndex !== null && (
        <LogoGenerationModal
          prompt={logos[generatingIndex].prompt}
          onSelect={handleGeneratedLogoSelect}
          onClose={() => setGeneratingIndex(null)}
        />
      )}
      {analyzing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">
              Analyzing logo colors and shapes...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
