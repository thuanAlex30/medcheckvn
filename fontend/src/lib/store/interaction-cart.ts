import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DrugSearchHit } from '@medcheck/shared-types';

interface InteractionCartItem {
  drug: DrugSearchHit;
  addedAt: number;
}

interface InteractionCartState {
  items: InteractionCartItem[];
  addDrug: (drug: DrugSearchHit) => void;
  removeDrug: (drugId: string) => void;
  clearAll: () => void;
  isInCart: (drugId: string) => boolean;
}

export const useInteractionCart = create<InteractionCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addDrug: (drug) => {
        const { items } = get();
        if (items.some((i) => i.drug.id === drug.id)) return;
        if (items.length >= 20) return; // max theo spec
        set({ items: [...items, { drug, addedAt: Date.now() }] });
      },

      removeDrug: (drugId) => {
        set({ items: get().items.filter((i) => i.drug.id !== drugId) });
      },

      clearAll: () => set({ items: [] }),

      isInCart: (drugId) => get().items.some((i) => i.drug.id === drugId),
    }),
    { name: 'medcheck-interaction-cart' },
  ),
);
