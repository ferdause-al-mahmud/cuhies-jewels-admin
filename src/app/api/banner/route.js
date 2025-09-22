import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// GET Route: Fetch all banners
export const GET = async () => {
    try {
        const db = await connectDB();
        const coverCollection = db.collection('coverPictures');
        const totalCover = await coverCollection.find({}).toArray();

        return NextResponse.json({
            success: true,
            data: totalCover,
        });
    } catch (error) {
        console.error("Error fetching cover pictures:", error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
};

// POST Route: Add a new banner
export const POST = async (request) => {
    try {
        const db = await connectDB();
        const coverCollection = db.collection('coverPictures');

        const body = await request.json();

        // Validate request body
        if (!body.url) {
            return NextResponse.json(
                { success: false, message: 'Missing required field: url' },
                { status: 400 }
            );
        }

        // Insert new banner into the database
        const result = await coverCollection.insertOne({
            url: body.url,
            createdAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: 'Banner added successfully',
        });
    } catch (error) {
        console.error("Error adding banner:", error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
};

// DELETE Route: Delete a banner by _id
export const DELETE = async (request) => {
    try {
        const db = await connectDB();
        const coverCollection = db.collection('coverPictures');

        const body = await request.json();
        const id = body._id; // Extract _id from the request body

        // Validate _id
        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Missing _id parameter' },
                { status: 400 }
            );
        }

        // Delete the document
        const result = await coverCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Banner not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Banner deleted successfully',
        });
    } catch (error) {
        console.error("Error deleting banner:", error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
};
