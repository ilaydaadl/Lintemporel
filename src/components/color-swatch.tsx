import { colorHex } from "@/lib/config";

/** Pastille ronde d'une couleur. */
export function ColorSwatch({
  name,
  hex,
  size = "h-3.5 w-3.5",
}: {
  name: string;
  hex?: string | null;
  size?: string;
}) {
  return (
    <span
      title={name}
      className={`inline-block shrink-0 rounded-full ring-1 ring-ink/15 ${size}`}
      style={{ backgroundColor: hex || colorHex(name) }}
    />
  );
}
