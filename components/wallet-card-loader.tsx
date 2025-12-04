import React from 'react';

// The key classes here are 'animate-pulse' and 'bg-gray-700' 
// (or whatever color you choose for the loading state).

export function WalletCardSkeleton() {
  return (
    // 1. Outer Container: Matches the live card's background and structure
    <div className="bg-purple-900 rounded-2xl p-6 text-white animate-pulse">
      
      {/* 2. Title Placeholder: Matches <h2> size and margin */}
      <div className="h-6 w-3/12 bg-gray-700 rounded mb-2"></div>
      
      {/* 3. Balance Placeholder: Matches <p> size and font */}
      <div className="h-10 w-6/12 bg-gray-700 rounded mb-6"></div>
      
      {/* 4. Buttons Container: Matches the live card's flex layout */}
      <div className="flex gap-3">
        
        {/* Button 1 Placeholder: Matches dimensions of 'Fund Wallet' link */}
        <div className="h-[42px] w-[130px] bg-gray-700 rounded-lg"></div> 
        
        {/* Button 2 Placeholder: Matches dimensions of 'Wallet History' link */}
        <div className="h-[42px] w-[150px] bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}