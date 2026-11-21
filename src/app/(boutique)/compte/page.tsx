import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountView } from "@/components/account-view";

export const metadata: Metadata = { title: "Mon compte" };

export default function ComptePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AccountView />
    </Suspense>
  );
}
