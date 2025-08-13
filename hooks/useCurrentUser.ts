"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => {
  if (!r.ok) throw new Error("Auth or fetch error");
  return r.json();
});

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR("/api/user/me", fetcher, {
    revalidateOnFocus: false,
  });

  return {
    loading: isLoading,
    error,
    user: data?.user as {
      id: string; name: string; email: string; phone?: string | null;
      emailVerified?: boolean | null; marketingEmailConsent?: boolean | null;
    } | undefined,
    primaryAddress: data?.primaryAddress as { id: string; districtId?: string | null; fullAddress?: string | null } | null | undefined,
    refresh: mutate,
  };
}
