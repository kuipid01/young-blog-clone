"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Global cache to persist data across components
const globalCache = new Map<string, any>();
const inflightRequests = new Map<string, Promise<any>>();

interface UseFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  enabled?: boolean; // like react-query
  deps?: any[];      // re-run when deps change
  cache?: boolean;   // enable/disable caching
}

export function useFetch<TResponse = any>(
  url: string,
  queryKey: string,
  options: UseFetchOptions = {}
) {
  const {
    method = "GET",
    body,
    headers = {},
    enabled = true,
    deps = [],
    cache = true,
  } = options;

  const abortControllerRef = useRef<AbortController | null>(null);

  const [data, setData] = useState<TResponse | null>(
    cache && globalCache.has(queryKey)
      ? globalCache.get(queryKey)
      : null
  );
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    // Cancel previous request if still in flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // If cached & using cache → return cached value immediately
    if (cache && globalCache.has(queryKey)) {
      setData(globalCache.get(queryKey));
      setLoading(false);
      return globalCache.get(queryKey);
    }

    // If request already running → reuse it
    if (inflightRequests.has(queryKey)) {
      const existing = inflightRequests.get(queryKey);
      return existing?.then((res: any) => {
        setData(res);
        setLoading(false);
        return res;
      });
    }

    const fetchPromise = fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: method !== "GET" ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || "Request failed");
        }
        return res.json();
      })
      .then((json) => {
        if (cache) globalCache.set(queryKey, json);
        setData(json);
        return json;
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // ignore abort
        setError(err);
        globalCache.delete(queryKey);
      })
      .finally(() => {
        inflightRequests.delete(queryKey);
        setLoading(false);
      });

    inflightRequests.set(queryKey, fetchPromise);
    return fetchPromise;
  }, [url, method, body, headers, enabled, queryKey, cache]);

  // Refetch on mount or when deps change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Manual refetch function
  const refetch = useCallback(() => {
    globalCache.delete(queryKey);
    return fetchData();
  }, [fetchData, queryKey]);

  return { data, loading, error, refetch };
}
