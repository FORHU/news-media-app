/**
 * Shown the moment a /search navigation starts (e.g. a category "See All"
 * click), while the server builds the results. Without it the previous page
 * just sits there until the feed is ready, which reads as a dead link.
 */
export default function SearchLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading results">
      <div className="mb-6 h-10 bg-gray-100 border-b-2 border-gray-200 animate-pulse" />
      <div className="h-6 w-48 bg-gray-100 mb-6 animate-pulse" />
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex gap-5 pb-6 border-b border-gray-100 animate-pulse">
          <div className="w-40 sm:w-48 flex-shrink-0 aspect-[4/3] bg-gray-100" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-20 bg-gray-100" />
            <div className="h-6 w-3/4 bg-gray-100" />
            <div className="h-4 w-full bg-gray-100" />
            <div className="h-3 w-32 bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
