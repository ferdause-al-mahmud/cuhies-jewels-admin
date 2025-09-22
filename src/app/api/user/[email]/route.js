import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/connectDB";

// GET /api/user/route.js
export async function GET(request, { params }) {
    try {
        const { email } = params;

        console.log(email)
        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        const db = await connectDB();
        const usersCollection = db.collection("users");

        // Fetch user by email
        const user = await usersCollection.findOne({ email: email });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Remove sensitive information before sending
        const { password, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

// PUT /api/user/route.js - Complete profile update
export async function PUT(request, { params }) {
    try {
        const { email } = params;
        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        const updateData = await request.json();

        // Remove email from update data to prevent email change
        const { email: emailFromBody, ...dataToUpdate } = updateData;

        // Validate required fields
        const requiredFields = ['displayName'];
        const missingFields = requiredFields.filter(field => !dataToUpdate[field] || dataToUpdate[field].trim() === '');

        if (missingFields.length > 0) {
            return NextResponse.json(
                { message: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate phone number format (basic validation)
        if (dataToUpdate.phoneNumber && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(dataToUpdate.phoneNumber)) {
            return NextResponse.json(
                { message: "Invalid phone number format" },
                { status: 400 }
            );
        }


        // Validate address fields if provided
        if (dataToUpdate.address) {
            const { street, city, state, zipCode } = dataToUpdate.address;

            // Basic validation for address fields
            if (zipCode && !/^[\d\s\-A-Za-z]{3,}$/.test(zipCode)) {
                return NextResponse.json(
                    { message: "Invalid ZIP code format" },
                    { status: 400 }
                );
            }
        }

        // Connect to MongoDB
        const db = await connectDB();
        const usersCollection = db.collection("users");

        // Check if user exists
        const existingUser = await usersCollection.findOne({ email: email });

        if (!existingUser) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Prepare the update object with proper structure
        const profileUpdate = {
            displayName: dataToUpdate.displayName,
            phoneNumber: dataToUpdate.phoneNumber || "",
            gender: dataToUpdate.gender || "",
            address: {
                street: dataToUpdate.address?.street || "",
                city: dataToUpdate.address?.city || "",
                state: dataToUpdate.address?.state || "",
                zipCode: dataToUpdate.address?.zipCode || "",
            },
            updatedAt: new Date(),
            profileCompleted: true
        };

        // Update user document
        const result = await usersCollection.updateOne(
            { email: email },
            { $set: profileUpdate }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { message: "No changes were made" },
                { status: 200 }
            );
        }

        // Fetch updated user data
        const updatedUser = await usersCollection.findOne({ email: email });
        const { password, ...userWithoutPassword } = updatedUser;

        return NextResponse.json({
            success: true,
            message: "User profile updated successfully",
            user: userWithoutPassword
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}

// PATCH /api/user/route.js - Partial profile update
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        const partialUpdateData = await request.json();

        // Remove email from update data to prevent email change
        const { email: emailFromBody, ...dataToUpdate } = partialUpdateData;

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json(
                { message: "No data provided for update" },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        const db = await connectDB();
        const usersCollection = db.collection("users");

        // Check if user exists
        const existingUser = await usersCollection.findOne({ email: email });

        if (!existingUser) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Build update object for partial update
        const updateObject = {
            ...dataToUpdate,
            updatedAt: new Date()
        };

        // Handle nested address updates
        if (dataToUpdate.address) {
            Object.keys(dataToUpdate.address).forEach(key => {
                updateObject[`address.${key}`] = dataToUpdate.address[key];
            });
            delete updateObject.address;
        }



        // Update user document
        const result = await usersCollection.updateOne(
            { email: email },
            { $set: updateObject }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Fetch updated user data
        const updatedUser = await usersCollection.findOne({ email: email });
        const { password, ...userWithoutPassword } = updatedUser;

        return NextResponse.json({
            success: true,
            message: "User profile updated successfully",
            user: userWithoutPassword
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}