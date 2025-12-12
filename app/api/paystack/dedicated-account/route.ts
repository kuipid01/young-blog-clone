// app/api/paystack/dedicated-account/route.ts

import { NextRequest, NextResponse } from 'next/server';

/**
 * Interface for the expected request body payload to create a dedicated account.
 * This should match the data structure required by the Paystack API.
 */
interface PaystackDedicatedAccountRequest {
  email: string;
  first_name: string;
  middle_name?: string; // Optional field
  last_name: string;
  phone: string;
  preferred_bank: string;
  country: string;
}

/**
 * Handle POST requests to /api/paystack/dedicated-account
 * This creates a dedicated virtual account for a customer on Paystack.
 */
export async function POST(request: NextRequest) {
  // 1. Get the data posted from the client
  let requestData: PaystackDedicatedAccountRequest;
  
  try {
    // Cast the parsed JSON to the defined interface for type checking
    requestData = (await request.json()) as PaystackDedicatedAccountRequest;
    
    // Simple validation check for required fields (optional but recommended)
    if (!requestData.email || !requestData.last_name || !requestData.preferred_bank) {
        return NextResponse.json({ error: 'Missing required fields (email, last_name, preferred_bank).' }, { status: 400 });
    }

  } catch (e) {
    // The request body was not valid JSON
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 2. Securely get the secret key
  // TypeScript requires casting process.env values to string or using non-null assertion (!)
  const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; 

  if (!SECRET_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Paystack secret key is missing.' },
      { status: 500 }
    );
  }

  const url = "https://api.paystack.co/dedicated_account";
  
  try {
    // 3. Perform the secure fetch request (POST)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      // The requestData is already strongly typed here
      body: JSON.stringify(requestData),
      cache: 'no-store',
    });

    // 4. Handle non-200 HTTP status codes from the Paystack API
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paystack API Error:', errorData);

      return NextResponse.json(errorData, { status: response.status });
    }

    // 5. On success, parse the JSON and return it to the client
    const data = await response.json();
    // You can define a PaystackDedicatedAccountResponse interface for data here too
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    // 6. Handle network or other unexpected errors
    console.error('Network or unexpected error:', error);
    
    // Ensure the error response is consistent
    return NextResponse.json(
      { error: 'Failed to create dedicated account on Paystack.' },
      { status: 500 }
    );
  }
}