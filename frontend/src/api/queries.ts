import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "./client";
import type {
  SessionsResponse,
  SessionDetailResponse,
  SearchResponse,
  StatsResponse,
} from "./types";

export interface SessionUpdate {
  title?: string;
  tags?: string[];
  is_pinned?: boolean;
}

export function useUpdateSession(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (update: SessionUpdate) => {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed to update session");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", id] });
    },
  });
}

export function useSessions(params: {
  limit?: number;
  offset?: number;
  project?: string;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.project) searchParams.set("project", params.project);

  const qs = searchParams.toString();
  const path = `/api/sessions${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: ["sessions", params],
    queryFn: () => fetchJSON<SessionsResponse>(path),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => fetchJSON<SessionDetailResponse>(`/api/sessions/${id}`),
    enabled: !!id,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () =>
      fetchJSON<SearchResponse>(
        `/api/search?q=${encodeURIComponent(query)}`,
      ),
    enabled: query.length > 1,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchJSON<StatsResponse>("/api/stats"),
  });
}
