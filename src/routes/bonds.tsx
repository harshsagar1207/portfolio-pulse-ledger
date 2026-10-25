import { createFileRoute } from "@tanstack/react-router";
import { AssetClassPage } from "@/components/app/AssetClassPage";

export const Route = createFileRoute("/bonds")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Bonds · Stock Portfolio Management" },
      { name: "description", content: "Coupon, maturity and terms for listed bonds." },
      { property: "og:title", content: "Bonds · Stock Portfolio Management" },
      { property: "og:description", content: "Coupon, maturity and terms for listed bonds." },
    ],
  }),
  component: BondsPage,
});

function BondsPage() {
  return <AssetClassPage title="Bonds" description="Coupon, maturity and terms for listed bonds." classes={["BOND","DEBT","GSEC"]} />;
}
