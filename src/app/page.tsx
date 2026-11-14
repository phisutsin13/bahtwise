import type { Metadata } from "next";
import { AppGate } from "@/components/auth/app-gate";

export const metadata: Metadata = {
  title: "Bahtwise",
};

export default function RootPage() {
  return <AppGate />;
}
