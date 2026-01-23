"use client";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  
  // API artık session yoksa 200 döndürüyor, bu yüzden sadece ok kontrolü yapıyoruz
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  return res.json();
};

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR("/api/user/me", fetcher, {
    revalidateOnFocus: false,
  });

  return {
    loading: isLoading,
    error: error || null,
    user: data?.user as {
      id: string; name: string; email: string; phone?: string | null;
      emailVerified?: boolean | null; marketingEmailConsent?: boolean | null;
    } | undefined,
    primaryAddress: data?.primaryAddress as { id: string; districtId?: string | null; fullAddress?: string | null } | null | undefined,
    refresh: mutate,
  };
}
