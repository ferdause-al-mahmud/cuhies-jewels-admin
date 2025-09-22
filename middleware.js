import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}

export async function middleware(req) {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
        return NextResponse.json({ message: 'Authorization token is required' }, { status: 401 });
    }

    try {
        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach the decoded token to the request object
        req.firebaseToken = decodedToken;

        return NextResponse.next(); // Continue if token is valid
    } catch (error) {
        return NextResponse.json({ message: 'Unauthorized or token verification failed' }, { status: 403 });
    }
}

export const config = {
    matcher: [], // Apply middleware to this specific API route
};
