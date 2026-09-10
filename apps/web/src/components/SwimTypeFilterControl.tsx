import {
  getSwimTypeFilterLabel,
  orderSwimTypeOptions,
  type SwimTypeFilter,
} from "../lib/swimTypeFilter";

export function SwimTypeFilterControl({
  value,
  onChange,
  availableTypes,
  testId = "swim-type-filter",
  className = "",
  label = "Swim type",
  compact = false,
}: {
  value: SwimTypeFilter;
  onChange: (next: SwimTypeFilter) => void;
  /** Types present in the current dataset; ALL is always included. */
  availableTypes: Set<string>;
  testId?: string;
  className?: string;
  label?: string;
  /** Map overlay: smaller chips, horizontal scroll. */
  compact?: boolean;
}) {
  const options = orderSwimTypeOptions(availableTypes);

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
      <div
        role="group"
        aria-label="Swim type filter"
        className={`overflow-x-auto scrollbar-hide ${
          compact ? "" : "-mx-1 px-1"
        }`}
      >
        <div
          className={`flex gap-1.5 min-w-max ${
            compact ? "bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 p-1" : ""
          }`}
        >
          {options.map((type) => {
            const active = value === type;
            return (
              <button
                key={type}
                type="button"
                data-testid={`swim-type-${type.toLowerCase()}`}
                onClick={() => onChange(type)}
                className={`whitespace-nowrap font-semibold transition-colors flex-shrink-0 ${
                  compact
                    ? `px-3 py-1.5 rounded-full text-xs min-h-[40px] ${
                        active
                          ? "bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`
                    : `min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transform hover:scale-105 ${
                        active
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`
                }`}
              >
                {getSwimTypeFilterLabel(type)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
