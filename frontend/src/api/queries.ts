import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "./client";
import type {
  SessionsResponse,
  SessionDetailResponse,
  SearchResponse,
  StatsResponse,
} from "./types";

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
