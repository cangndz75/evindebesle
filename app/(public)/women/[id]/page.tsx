import { redirect } from "next/navigation";

export default async function WomenProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Women product detail pages redirect to main product detail page
  // You can customize this later if needed
  const { id } = await params;
  redirect(`/product/${id}`);
}
