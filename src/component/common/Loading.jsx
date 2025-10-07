export const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-4',
    lg: 'h-16 w-16 border-4'
  };

  return (
    <div className="flex justify-center items-center p-8">
      <div className={`animate-spin rounded-full border-blue-500 border-t-transparent ${sizes[size]}`} />
    </div>
  );
};

export const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-lg p-6 border border-gray-200">
    <div className="flex items-center gap-2 mb-3">
      <div className="h-6 w-24 bg-gray-200 rounded-full" />
      <div className="h-4 w-16 bg-gray-200 rounded" />
    </div>
    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
    <div className="h-4 bg-gray-200 rounded w-5/6" />
  </div>
);

export const SkeletonSlider = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg w-full h-80">
    <div className="flex items-end h-full p-6">
      <div className="w-full">
        <div className="h-6 bg-gray-300 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-300 rounded w-3/4" />
      </div>
    </div>
  </div>
);

export const SkeletonNewsList = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
    </div>
    <div className="divide-y divide-gray-200">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6">
          <SkeletonCard />
        </div>
      ))}
    </div>
  </div>
);