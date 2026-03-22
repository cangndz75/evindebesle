"use client";
 
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LookEditor from "../../_components/LookEditor";
import { Skeleton } from "@/components/ui/skeleton";
 
export default function EditLookPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetch(`/api/admin-look-configs?id=${id}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, [id]);
 
  if (loading) return <div className="p-10 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-[500px] w-full" /></div>;
  if (!data) return <div className="p-10">Kombinasyon bulunamadı.</div>;
 
  return (
    <div className="p-10">
      <LookEditor initialData={data} />
    </div>
  );
}
