import { createFileRoute } from "@tanstack/react-router";
import { AssetClassPage } from "@/components/app/AssetClassPage";

export const Route = createFileRoute("/ipos")({
  head: () => ({
    meta: [
      { title: "IPOs · Stock Portfolio Management" },
      { name: "description", content: "Issue dates, price bands and subscription status." },
      { property: "og:title", content: "IPOs · Stock Portfolio Management" },
      { property: "og:description", content: "Issue dates, price bands and subscription status." },
    ],
  }),
  component: IPOsPage,
});

function IPOsPage() {
  return <AssetClassPage title="IPOs" description="Issue dates, price bands and subscription status." classes={["IPO"]} />;
}
