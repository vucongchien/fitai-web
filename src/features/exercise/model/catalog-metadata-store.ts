import { useSyncExternalStore } from "react";
import { getCatalogMetadataServerAction } from "@/features/exercise/server/catalog-actions";
import type {
  CatalogBodyPartItem,
  CatalogEquipmentItem,
  CatalogMuscleItem,
} from "@/features/exercise/server/catalog-actions";

export interface CatalogMetadataState {
  equipments: CatalogEquipmentItem[];
  muscles: CatalogMuscleItem[];
  bodyParts: CatalogBodyPartItem[];
  isLoading: boolean;
  isLoaded: boolean;
}

const INITIAL_STATE: CatalogMetadataState = {
  equipments: [],
  muscles: [],
  bodyParts: [],
  isLoading: false,
  isLoaded: false,
};

let state: CatalogMetadataState = INITIAL_STATE;
const listeners = new Set<() => void>();
let fetchPromise: Promise<void> | null = null;

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const catalogMetadataStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (!state.isLoaded && !state.isLoading && typeof window !== "undefined") {
      void catalogMetadataStore.load();
    }
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): CatalogMetadataState {
    return state;
  },

  getServerSnapshot(): CatalogMetadataState {
    return INITIAL_STATE;
  },

  async load(): Promise<CatalogMetadataState> {
    if (state.isLoaded) return state;
    if (fetchPromise) return fetchPromise.then(() => state);

    state = { ...state, isLoading: true };
    emitChange();

    fetchPromise = (async () => {
      try {
        const res = await getCatalogMetadataServerAction();
        if (res.success) {
          state = {
            equipments: res.equipments || [],
            muscles: res.muscles || [],
            bodyParts: res.bodyParts || [],
            isLoading: false,
            isLoaded: true,
          };
        } else {
          state = { ...state, isLoading: false, isLoaded: true };
        }
      } catch (err) {
        console.error("Failed to load catalog metadata:", err);
        state = { ...state, isLoading: false, isLoaded: true };
      } finally {
        fetchPromise = null;
        emitChange();
      }
    })();

    return fetchPromise.then(() => state);
  },
};

export function useCatalogMetadata(): CatalogMetadataState {
  return useSyncExternalStore(
    catalogMetadataStore.subscribe,
    catalogMetadataStore.getSnapshot,
    catalogMetadataStore.getServerSnapshot
  );
}
