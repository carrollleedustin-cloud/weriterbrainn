import { DEMO_ENTITIES } from "@/lib/demo-data";
import { MindspaceContent } from "./MindspaceContent";

export function generateStaticParams() {
  return DEMO_ENTITIES.filter((e) => e.type === "character").map((e) => ({ characterId: e.id }));
}

export default async function MindspacePage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  return <MindspaceContent characterId={characterId} />;
}
