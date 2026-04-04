"use client";

import MenProductsPage from "./MenProductsPageNew";

export default function MenNewArrivalsPage() {
  return (
    <MenProductsPage
      pageTitle="Yeni Cikanlar"
      breadcrumbCurrent="Yeni Cikanlar"
      hideCategoryFilters
      baseQuery={{ newArrivals: true }}
    />
  );
}
