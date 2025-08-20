import { notFound } from "next/navigation";
import Link from "next/link";
import FinalizeCapture from "./FinalizeCapture";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams: Promise<{ sid?: string; status?: string }> };

export default async function ResultPage({ searchParams }: Props) {
  const { sid, status } = await searchParams;
  if (!sid) notFound();
  const ok = status === "ok";
  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-2">
        {ok ? "3D Doğrulama Başarılı" : "3D Doğrulama Başarısız"}
      </h1>
      <p className="text-gray-600 mb-6">
        {ok ? "Ödeme tamamlanıyor. Lütfen bu sayfayı kapatmayın."
            : "İşlem tamamlanamadı. Tekrar deneyebilirsiniz."}
      </p>
      <FinalizeCapture sid={sid} autoStart={ok} />
      <div className="mt-8 text-sm text-gray-500">Oturum: {sid}</div>
      <div className="mt-6"><Link href="/" className="underline">Ana sayfaya dön</Link></div>
    </main>
  );
}
