import type { Metadata } from "next";
import { AppGate } from "@/components/auth/app-gate";

export const metadata: Metadata = {
  title: "My Money",
};

export default function RootPage() {
  return <AppGate />;
}
