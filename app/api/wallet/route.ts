// app/api/wallet/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; 
import { eq } from 'drizzle-orm';
import { wallets } from '../../../lib/schema';

/**
 * Interface for the expected request body payload to update the wallet.
 * Note: 'email' is NOT in your schema, so we are using the fields that ARE.
 * We include userId/walletId for the WHERE clause.
 */
interface WalletUpdatePayload {
  walletId: string; // Corresponds to the 'userId' field in your schema
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  accountName?: string;
  bankName?: string;
  flwRef?: string;
  accountNumber?: string;
}

/**
 * Handle PUT requests to /api/wallet
 * This updates the user's wallet details in the database using Drizzle ORM.
 */
export async function PUT(request: NextRequest) {
  let requestData: WalletUpdatePayload;
  
  try {
    // 1. Parse and validate the request body
    requestData = (await request.json()) as WalletUpdatePayload;

    if (!requestData.walletId) {
        return NextResponse.json({ error: 'Missing walletId (user identifier) in the request body.' }, { status: 400 });
    }

  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Extract the ID and the fields to update
  const { walletId, ...updateFields } = requestData;

  // Filter out any undefined or null values to prevent Drizzle from overwriting valid data with nulls
  const validUpdateFields = Object.fromEntries(
    Object.entries(updateFields).filter(([, value]) => value !== undefined && value !== null)
  );
  
  // If no fields are provided for the update, return a clean error
  if (Object.keys(validUpdateFields).length === 0) {
    return NextResponse.json(
        { error: 'No valid update fields provided.' }, 
        { status: 400 }
    );
  }

  try {
    // 2. Perform the database update using Drizzle ORM
    const result = await db
      .update(wallets)
      .set({
        ...validUpdateFields,
        updatedAt: new Date(), // Manually update the timestamp
      })
      // The Primary Key in your schema is `userId`, which we receive as `walletId`
      .where(eq(wallets.userId, walletId))
      .returning(); // Use .returning() to get the updated row(s)

    // 3. Check if the update was successful
    if (result.length === 0) {
      return NextResponse.json(
        { error: `Wallet with ID ${walletId} not found.` },
        { status: 404 }
      );
    }

    // 4. Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Wallet details updated successfully.',
        data: result[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Database update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update wallet details due to a server error.' },
      { status: 500 }
    );
  }
}