import { useCallback, useEffect, useState } from "react";
import { listNeighborhoods, type Neighborhood } from "@/lib/api/tariffs";

export function useNeighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listNeighborhoods();
      setNeighborhoods(data);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e ?? "Erreur"));
      setNeighborhoods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { neighborhoods, loading, error, reload };
}
