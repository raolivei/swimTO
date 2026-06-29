import { MapPin, Sun, Building2 } from "lucide-react";
import type { PoolTypeFilter } from "../lib/api";

const POOL_TYPE_OPTIONS: {
  value: PoolTypeFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "all", label: "All", icon: MapPin },
  { value: "indoor", label: "Indoor", icon: Building2 },
  { value: "outdoor", label: "Outdoor", icon: Sun },
];

export function PoolTypeFilterControl({
  value,
  onChange,
  testId = "map-pool-type-filter",
  className = "",
  showHint = true,
  label,
}: {
  value: PoolTypeFilter;
  onChange: (next: PoolTypeFilter) => void;
  testId?: string;
  className?: string;
  showHint?: boolean;
  label?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={`flex flex-col gap-1.5 ${className}`}
    >
      {label && (
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-1">
          {label}
        </span>
      )}
      {showHint && (
        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 px-1 hidden sm:block">
          Outdoor pools open for summer
        </p>
      )}
      <div
        role="group"
        aria-label="Pool type filter"
        className="flex bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 p-1"
      >
        {POOL_TYPE_OPTIONS.map(({ value: option, label, icon: Icon }) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              data-testid={`pool-type-${option}`}
              onClick={() => onChange(option)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors min-h-[40px] ${
                active
                  ? option === "outdoor"
                    ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
                    : "bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
