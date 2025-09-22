// API route for logging out and clearing the cookie
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const response = NextResponse.json({ message: 'User logged out successfully' });

        // Clear the access-token cookie
        response.cookies.delete('access-token', {
            path: '/', // Make sure to specify the path
        });

        return response;
    } catch (error) {
        return NextResponse.json({ message: 'Error logging out', error: error.message }, { status: 500 });
    }
}
