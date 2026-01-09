
import { NextResponse } from 'next/server';

export async function GET() {
    const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!SECRET_KEY) {
        return NextResponse.json({ error: 'Paystack secret key missing' }, { status: 500 });
    }

    try {
        const response = await fetch('https://api.paystack.co/bank', {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch banks');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching banks:', error);
        return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 });
    }
}
