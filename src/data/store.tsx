import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Property } from '../domain/types';
import { LocalStorageRepository, normalizeProperty, type PropertyRepository } from './repository';

interface Store {
  properties: Property[];
  loading: boolean;
  get(id: string): Property | undefined;
  save(p: Property): Promise<Property>;
  remove(id: string): Promise<void>;
  replaceAll(items: Property[]): Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: PropertyRepository;
}) {
  const repo = useMemo(() => repository ?? new LocalStorageRepository(), [repository]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repo.list().then((items) => {
      setProperties(items);
      setLoading(false);
    });
  }, [repo]);

  const save = useCallback(
    async (p: Property) => {
      const saved = await repo.save(p);
      setProperties((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id);
        if (idx < 0) return [...prev, saved];
        const next = prev.slice();
        next[idx] = saved;
        return next;
      });
      return saved;
    },
    [repo],
  );

  const remove = useCallback(
    async (id: string) => {
      await repo.remove(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
    },
    [repo],
  );

  const replaceAll = useCallback(
    async (items: Property[]) => {
      const normalized = items.map(normalizeProperty);
      await repo.replaceAll(normalized);
      setProperties(normalized);
    },
    [repo],
  );

  const value = useMemo<Store>(
    () => ({
      properties,
      loading,
      get: (id) => properties.find((p) => p.id === id),
      save,
      remove,
      replaceAll,
    }),
    [properties, loading, save, remove, replaceAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
