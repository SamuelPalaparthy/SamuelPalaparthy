import { DEFAULT_DEAL, type Property } from '../domain/types';

/**
 * Storage boundary for the app. Today it is backed by localStorage (single user, single device).
 * When we move to multi-user (property owners, then investors), add an API-backed implementation
 * of this same interface — UI code only talks to `PropertyRepository`.
 */
export interface PropertyRepository {
  list(): Promise<Property[]>;
  save(property: Property): Promise<Property>;
  remove(id: string): Promise<void>;
  replaceAll(properties: Property[]): Promise<void>;
}

const STORAGE_KEY = 'brrrr.properties.v1';

/** Fill in any fields missing from older/imported records so the app never crashes on shape drift. */
export function normalizeProperty(raw: Partial<Property>): Property {
  const now = new Date().toISOString();
  return {
    id: raw.id ?? crypto.randomUUID(),
    name: raw.name ?? 'Untitled property',
    address: raw.address ?? '',
    stage: raw.stage ?? 'analyzing',
    purchaseDate: raw.purchaseDate || undefined,
    refiDate: raw.refiDate || undefined,
    seasoningMonths: raw.seasoningMonths ?? 6,
    notes: raw.notes ?? '',
    deal: { ...DEFAULT_DEAL, ...(raw.deal ?? {}) },
    rehabItems: (raw.rehabItems ?? []).map((i) => ({
      id: i.id ?? crypto.randomUUID(),
      category: i.category ?? 'General',
      description: i.description ?? '',
      budget: Number(i.budget) || 0,
      actual: Number(i.actual) || 0,
      done: !!i.done,
    })),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

export class LocalStorageRepository implements PropertyRepository {
  private read(): Property[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeProperty) : [];
    } catch {
      return [];
    }
  }

  private write(items: Property[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  async list() {
    return this.read();
  }

  async save(property: Property) {
    const items = this.read();
    const saved = { ...property, updatedAt: new Date().toISOString() };
    const idx = items.findIndex((p) => p.id === property.id);
    if (idx >= 0) items[idx] = saved;
    else items.push(saved);
    this.write(items);
    return saved;
  }

  async remove(id: string) {
    this.write(this.read().filter((p) => p.id !== id));
  }

  async replaceAll(properties: Property[]) {
    this.write(properties.map(normalizeProperty));
  }
}
