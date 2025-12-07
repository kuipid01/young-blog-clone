import { useCallback, useState } from "react";

interface MutationProps<TBody = any> {
  route: string;
  method: "POST" | "PATCH" | "DELETE";
  body?: TBody;
  headers?: HeadersInit;
}

export const useMutate = <TResponse = any>() => {
  const [isPending, setIsPending] = useState(false);
  const [data, setData] = useState<TResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async <TBody,>({
    method,
    route,
    body,
    headers,
  }: MutationProps<TBody>): Promise<TResponse | null> => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(route, {
        method,
        headers: {
          "Content-Type": body ? "application/json" : "",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const json = (await response.json()) as TResponse;
      setData(json);
      return json;
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(msg);
      console.error("Mutation Error:", err);
      return null;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    mutate,
    isPending,
    error,
    data,
  };
};



