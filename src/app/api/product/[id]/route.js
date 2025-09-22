import { connectDB } from "@/app/lib/connectDB";
import { NextResponse } from 'next/server';

export const GET = async (request, { params }) => {
    const { id } = params;
    const db = await connectDB();
    const productsCollection = db.collection('products');

    try {
        const product = await productsCollection.findOne({ id });  // Using custom string id

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
};

// PUT method for updating product
export const PUT = async (request, { params }) => {
    const { id } = params;  // Get custom product ID from dynamic route
    const db = await connectDB();
    const productsCollection = db.collection('products');

    try {
        // Parse updated product data from the request body
        const updatedData = await request.json();

        // Find and update the product by custom string ID
        const result = await productsCollection.updateOne(
            { id }, // Filter by the custom 'id' field (like 'Keshmilion-003')
            { $set: updatedData } // Update with new data
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product updated successfully' }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
};

//deleting product
export const DELETE = async (request, { params }) => {
    const { id } = params;

    const db = await connectDB();
    const productsCollection = db.collection('products');

    try {
        const result = await productsCollection.deleteOne({ id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
};