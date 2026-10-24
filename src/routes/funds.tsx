import { createFileRoute } from "@tanstack/react-router";
import { AssetClassPage } from "@/components/app/AssetClassPage";

export const Route = createFileRoute("/funds")({
  head: () => ({
    meta: [
      { title: "Mutual Funds · Stock Portfolio Management" },
      { name: "description", content: "Schemes, AMC, category, expense ratio and NAV." },
      { property: "og:title", content: "Mutual Funds · Stock Portfolio Management" },
      { property: "og:description", content: "Schemes, AMC, category, expense ratio and NAV." },
    ],
  }),
  component: MutualFundsPage,
});

function MutualFundsPage() {
  return <AssetClassPage title="Mutual Funds" description="Schemes, AMC, category, expense ratio and NAV." classes={["MUTUAL","FUND","MF"]} />;
}
