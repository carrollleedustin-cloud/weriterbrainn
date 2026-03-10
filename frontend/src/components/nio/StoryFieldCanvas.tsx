"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./StoryFieldScene"), { ssr: false });

export function StoryFieldCanvas({ mouse }: { mouse: { x: number; y: number } }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <Scene mouse={mouse} />
    </div>
  );
}
