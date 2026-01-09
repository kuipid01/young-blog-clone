
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const account_number = searchParams.get('account_number');
    const bank_code = searchParams.get('bank_code');
    const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!SECRET_KEY) {
        return NextResponse.json({ error: 'Paystack secret key missing' }, { status: 500 });
    }

    if (!account_number || !bank_code) {
        return NextResponse.json({ error: 'Missing account number or bank code' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
            headers: {
                Authorization: `Bearer ${SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error resolving account:', error);
        return NextResponse.json({ error: 'Failed to resolve account' }, { status: 500 });
    }
}
