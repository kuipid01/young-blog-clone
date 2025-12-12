import { create } from "zustand";

export type WalletState = {
  walletBalance: number | null;
};

export type WalletActions = {
  setWalletBalance: (amount: number) => void;
};

export type WalletStore = WalletState & WalletActions;

const useWalletStore = create<WalletStore>((set) => ({
  walletBalance: null,

  setWalletBalance: (amount) => set(() => ({ walletBalance: amount })),
}));

export default useWalletStore;
