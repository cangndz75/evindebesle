"use client";

import MenProductsPage from "./MenProductsPageNew";

export default function MenBestSellersPage() {
  return (
    <MenProductsPage
      pageTitle="Erkek En Cok Satanlar"
      breadcrumbCurrent="En Cok Satanlar"
      hideCategoryFilters
      baseQuery={{ tag: "best seller" }}
    />
  );
}

