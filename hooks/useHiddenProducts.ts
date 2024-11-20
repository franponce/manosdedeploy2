import { create } from 'zustand';

interface HiddenProductsState {
  showHidden: boolean;
  toggle: () => void;
}

export const useHiddenProducts = create<HiddenProductsState>((set) => ({
  showHidden: false,
  toggle: () => set((state: HiddenProductsState) => {
    console.log('Toggling state from:', state.showHidden, 'to:', !state.showHidden);
    return { showHidden: !state.showHidden };
  }),
})); 