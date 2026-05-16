import { Skeleton } from "@/components/ui/skeleton";

/** Ana sayfa: ByltStyleHero h-[70vh] md:h-[92vh] + rail + bloklar */
export function HomeRouteLoading() {
  return (
    <div className="w-full overflow-x-hidden bg-[#F7F5F2]">
      <section className="relative w-full h-[70vh] md:h-[92vh] overflow-hidden bg-neutral-200">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-neutral-300/80" />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 pt-12 md:px-10 md:pt-16">
          <Skeleton className="mb-4 h-3 w-48 md:mb-6 md:h-4 md:w-64" />
          <Skeleton className="mb-6 h-16 w-full max-w-md md:mb-10 md:h-24 md:max-w-2xl" />
          <Skeleton className="mb-2 h-14 w-full max-w-[200px] md:h-16 md:max-w-xs" />
        </div>
      </section>
      <div className="py-4">
        <div className="mx-auto flex max-w-6xl gap-3 overflow-hidden px-4 md:gap-4 md:px-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-24 shrink-0 rounded-full md:h-16 md:w-28" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 md:px-8">
        <Skeleton className="h-64 w-full rounded-lg md:h-72" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-3/4 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-32 w-full max-w-xl rounded-lg" />
      </div>
    </div>
  );
}

/** Ürün detay: galeri + sağ kolon (başlık, fiyat, beden) */
export function ProductDetailRouteLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <Skeleton className="aspect-3/4 w-full max-w-xl rounded-lg lg:mx-0" />
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-14 shrink-0 rounded-md md:h-20 md:w-16" />
            ))}
          </div>
        </div>
        <div className="space-y-6 lg:col-span-5">
          <Skeleton className="h-8 w-[75%] md:h-10" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[83%]" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-12 rounded border md:h-11 md:w-14" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-full md:h-14" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Sepet sayfası: max-w-4xl kart + satırlar */
export function CartRouteLoading() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-3 pb-10 sm:px-6 md:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-36 font-serif md:h-9" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="space-y-6 p-4 md:p-8">
            <Skeleton className="h-28 w-full rounded-2xl" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-6 rounded-2xl border border-gray-100 p-4">
                <Skeleton className="h-32 w-24 shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-[85%] max-w-md" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-9 w-28 rounded-full" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Ödeme: container + lg:grid 7+5 */
export function CheckoutRouteLoading() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-8 md:py-12">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <div className="space-y-4">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-6 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-16 w-14 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Özet: max-w-7xl + lg:grid-cols-3 (2+1) */
export function CheckoutSummaryRouteLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Skeleton className="mb-8 h-9 w-64 md:h-10 md:w-80" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 border-b border-gray-100 py-4 last:border-0">
                  <Skeleton className="h-32 w-24 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-[80%]" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex justify-between pt-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Skeleton className="mb-4 h-6 w-40" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-6 h-4 w-3/4" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Liste (erkek/kadın/yeni): filtre şeridi + grid 2/4 */
export function ProductListingRouteLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-8 w-48 md:h-10 md:w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-8 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-3/4 w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Profil: sidebar + içerik (layout ile uyumlu) */
export function ProfileAccountRouteLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col gap-6 md:flex-row">
      <div className="hidden w-64 shrink-0 space-y-3 md:block">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
      <div className="flex-1 space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-48 w-full max-w-xl rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
        <Skeleton className="h-11 w-full max-w-xs rounded-md" />
      </div>
    </div>
  );
}
