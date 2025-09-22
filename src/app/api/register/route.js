import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';  // For password hashing
import { connectDB } from '@/app/lib/connectDB';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log(body, "Fron server")

        const { name, email, password, phoneNumber, isVerified } = body;

        const db = await connectDB();
        const existingUser = await db.collection('users').findOne({ email });

        if (existingUser) {
            // If the user already exists, return conflict (or success for Google Login)
            return NextResponse.json(
                { message: 'User already exists.' },
                { status: 409 } // 409 indicates a conflict
            );
        }

        const userData = {
            name,
            email,
            phoneNumber: phoneNumber || null,
            isVerified: isVerified || false,
            password: password ? await bcrypt.hash(password, 10) : null,
            role: "customer",
            createdAt: new Date(),
        };

        const result = await db.collection('users').insertOne(userData);

        return NextResponse.json(
            { message: 'User created successfully.', userId: result.insertedId },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json(
            { message: 'Failed to register user.', error: error.message },
            { status: 500 }
        );
    }
}
