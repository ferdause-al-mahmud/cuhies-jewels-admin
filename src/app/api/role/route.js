import { connectDB } from '@/app/lib/connectDB';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensures this API route is always dynamic

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        const db = await connectDB();
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ role: user.role }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user role:', error);
        return NextResponse.json(
            { message: 'Failed to fetch user role.', error: error.message },
            { status: 500 }
        );
    }
}
