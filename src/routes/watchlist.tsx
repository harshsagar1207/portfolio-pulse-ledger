import { createFileRoute } from "@tanstack/react-router";
import { NotConnected, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Watchlist · Stock Portfolio Management" },
      { name: "description", content: "Track instruments you follow." },
      { property: "og:title", content: "Watchlist · Stock Portfolio Management" },
      { property: "og:description", content: "Track instruments you follow." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  return (
    <>
      <PageHeader title="Watchlist" description="Track instruments you follow." />
      <NotConnected feature="Watchlist" detail="No watchlist endpoint exists in the verified API." />
    </>
  );
}
