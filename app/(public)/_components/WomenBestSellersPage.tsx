"use client";

import WomenProductsPage from "./WomenProductsPage";

export default function WomenBestSellersPage() {
  return (
    <WomenProductsPage
      pageTitle="Kadin En Cok Satanlar"
      breadcrumbCurrent="En Cok Satanlar"
      hideCategoryFilters
      baseQuery={{ tag: "best seller" }}
    />
  );
}
