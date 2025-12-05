"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useUserWallet } from "../../app/utils/get-wallet";
import AvatarMenu from "../logout-menu";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { wallet, loading, refetchWallet } = useUserWallet();
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Logo for header */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JM</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-violet-600 leading-tight">
                Jemil
              </span>
            
              <span className="text-[9px] text-gray-500 leading-tight">
                Marketplace
              </span>
            </div>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Wallet Balance */}
          <div className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {" "}
            ₦{wallet?.walletBalance ?? "0.00"}
          </div>

          {/* User Avatar */}
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
