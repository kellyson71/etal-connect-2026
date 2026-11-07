"use client";
import dynamic from "next/dynamic";
const EtalApp = dynamic(() => import("./components/etal-app"), {
  ssr: false,
  loading: () => (
    <main className="app-stage">
      <div className="phone">
        <div className="phone-display startup-screen">
          <span className="wordmark">
            etal<span>connect.</span>
          </span>
          <p role="status">Preparando seu encontro…</p>
        </div>
      </div>
    </main>
  ),
});
export default function Page() {
  return <EtalApp />;
}
