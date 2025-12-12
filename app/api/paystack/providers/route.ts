// app/api/paystack/providers/route.js

import { NextResponse } from 'next/server';

/**
 * Handle GET requests to /api/paystack/providers
 * This acts as a secure backend proxy for the Paystack API.
 */
export async function GET() {
  // 1. Get the secret key from environment variables
  // Ensure the variable name matches your .env.local file
  const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; 

  if (!SECRET_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: Paystack secret key is missing.' },
      { status: 500 }
    );
  }

  const url = "https://api.paystack.co/dedicated_account/available_providers";
  
  try {
    // 2. Perform the secure fetch request, replicating the cURL command
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // This is the Authorization header from the cURL command
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      // Optional: Prevent caching of the response data
      cache: 'no-store',
    });

    // 3. Handle non-200 HTTP status codes from the Paystack API
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paystack API Error:', errorData);

      // Return the error status and body to the client
      return NextResponse.json(errorData, { status: response.status });
    }

    // 4. On success, parse the JSON and return it to the client
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    // 5. Handle network or other unexpected errors
    console.error('Network or unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Paystack.' },
      { status: 500 }
    );
  }
}