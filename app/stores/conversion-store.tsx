import { create } from "zustand";

export type RateState = {
  rate: number | null;
};

export type RateActions = {
  setRateState: (amount: number) => void;
};

export type RateStore = RateState & RateActions;

const useRateStore = create<RateStore>((set) => ({
  rate: null,

  setRateState: (amount) => set(() => ({ rate: amount })),
}));

export default useRateStore;
