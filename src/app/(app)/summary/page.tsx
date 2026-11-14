import type { Metadata } from "next";
import { SummaryView } from "@/components/summary/summary-view";

export const instant = false;

export const metadata: Metadata = {
  title: "Summary",
};

export default function SummaryPage() {
  return <SummaryView />;
}
