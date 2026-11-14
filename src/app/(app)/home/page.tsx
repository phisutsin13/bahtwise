import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";

// The authenticated shell resolves the browser session and current date before
// rendering, so this segment opts out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return <HomeView />;
}
