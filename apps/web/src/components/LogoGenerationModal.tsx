import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import type { GeneratedLogo } from "../lib/api";

interface LogoGenerationModalProps {
  prompt: string;
  onSelect: (logo: GeneratedLogo) => void;
  onClose: () => void;
}

export function LogoGenerationModal({
  prompt,
  onSelect,
  onClose,
}: LogoGenerationModalProps) {
  const [generating, setGenerating] = useState(false);
  const [generatedLogos, setGeneratedLogos] = useState<GeneratedLogo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<"dalle-3" | "leonardo">("dalle-3");

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setGeneratedLogos([]);

    try {
      const { logoApi } = await import("../lib/api");
      const response = await logoApi.generate(prompt, model, 1);
      setGeneratedLogos(response.logos);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to generate logo. Please check your API keys."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Generate Logo
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {prompt}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI Model
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setModel("dalle-3")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  model === "dalle-3"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                DALL-E 3
              </button>
              <button
                onClick={() => setModel("leonardo")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  model === "leonardo"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Leonardo.ai
              </button>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Logo
              </>
            )}
          </button>
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Make sure OPENAI_API_KEY or LEONARDO_API_KEY is set in your .env
                file.
              </p>
            </div>
          )}
          {generatedLogos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Generated Logos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedLogos.map((logo, index) => (
                  <div
                    key={index}
                    className="group relative rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:border-primary-400 dark:hover:border-primary-500 transition-all cursor-pointer"
                    onClick={() => onSelect(logo)}
                  >
                    <div className="aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      <img
                        src={logo.image_data}
                        alt={`Generated logo ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center">
                        <p className="text-sm font-medium">Click to select</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {logo.model}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
