import Home from "./home";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-600">Loading...</p></div>}>
      <Home />
    </Suspense>
  );
}
