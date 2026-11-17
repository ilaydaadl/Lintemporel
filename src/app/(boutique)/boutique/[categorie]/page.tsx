import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopView } from "@/components/shop-view";
import { CATEGORIES, categoryBySlug } from "@/lib/config";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categorie: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/boutique/[categorie]">) {
  const { categorie } = await params;
  return { title: categoryBySlug(categorie)?.label ?? "Boutique" };
}

export default function CategoryPage({
  params,
}: PageProps<"/boutique/[categorie]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({
  params,
}: {
  params: Promise<{ categorie: string }>;
}) {
  const { categorie } = await params;
  if (!categoryBySlug(categorie)) notFound();
  return <ShopView activeSlug={categorie} />;
}
