import PetReportCardList from "../_components/PetReportCardList";

export default async function PetReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <PetReportCardList petId={id} />
    </div>
  );
}