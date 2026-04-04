"use client";

import MenProductsPage from "./MenProductsPageNew";

export default function MenFootwearPage() {
  return (
    <MenProductsPage
      pageTitle="Erkek Ayakkabi"
      breadcrumbCurrent="Ayakkabi"
      hideCategoryFilters
      baseQuery={{ categorySlug: "footwear" }}
    />
  );
}
