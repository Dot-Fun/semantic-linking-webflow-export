"use client";

interface NavigationProps {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function Navigation({
  currentIndex,
  total,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: NavigationProps) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
      >
        Previous
      </button>

      <div className="text-gray-700 font-medium">
        {currentIndex + 1} of {total}
      </div>

      <button
        onClick={onNext}
        disabled={!hasNext}
        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
      >
        Next
      </button>
    </div>
  );
}