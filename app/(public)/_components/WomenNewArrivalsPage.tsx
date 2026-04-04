"use client";

import WomenProductsPage from "./WomenProductsPage";

export default function WomenNewArrivalsPage() {
  return (
    <WomenProductsPage
      pageTitle="Yeni Cikanlar"
      breadcrumbCurrent="Yeni Cikanlar"
      hideCategoryFilters
      baseQuery={{ newArrivals: true }}
    />
  );
}
