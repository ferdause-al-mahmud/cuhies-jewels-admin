import { connectDB } from "@/app/lib/connectDB";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// GET - Fetch all reviews with advanced filtering (for admin dashboard)
export const GET = async (request) => {
    try {
        const db = await connectDB();
        const reviewsCollection = db.collection("reviews");

        const { searchParams } = new URL(request.url);

        // Filter parameters
        const status = searchParams.get("status"); // pending, approved, rejected
        const productId = searchParams.get("productId");
        const rating = searchParams.get("rating"); // 1-5
        const sortBy = searchParams.get("sortBy") || "createdAt"; // createdAt, rating, reviewerName
        const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc
        const limit = parseInt(searchParams.get("limit")) || 0; // 0 means no limit
        const skip = parseInt(searchParams.get("skip")) || 0; // For pagination
        const search = searchParams.get("search"); // Search in reviewText and reviewerName

        // Build query object
        let query = {};

        // Status filter
        if (status && ["pending", "approved", "rejected"].includes(status)) {
            query.status = status;
        }

        // Product ID filter
        if (productId) {
            query.productId = productId;
        }

        // Rating filter
        if (rating) {
            const ratingNum = parseInt(rating);
            if (ratingNum >= 1 && ratingNum <= 5) {
                query.rating = ratingNum;
            }
        }

        // Search filter (text search in review content and reviewer name)
        if (search && search.trim() !== "") {
            query.$or = [
                { reviewText: { $regex: search, $options: "i" } },
                { reviewerName: { $regex: search, $options: "i" } },
            ];
        }

        // Build sort object
        const sortObject = {};
        if (["createdAt", "rating", "reviewerName", "updatedAt"].includes(sortBy)) {
            sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;
        } else {
            sortObject.createdAt = -1; // Default sort
        }

        // Execute query with filters
        const reviews = await reviewsCollection
            .find(query)
            .sort(sortObject)
            .skip(skip)
            .limit(limit)
            .toArray();

        // Get total count for pagination
        const totalCount = await reviewsCollection.countDocuments(query);

        // Get overall statistics (all reviews, not filtered)
        const allReviews = await reviewsCollection.find({}).toArray();

        const stats = {
            total: allReviews.length,
            pending: allReviews.filter((r) => r.status === "pending").length,
            approved: allReviews.filter((r) => r.status === "approved").length,
            rejected: allReviews.filter((r) => r.status === "rejected").length,
            averageRating: allReviews.length > 0
                ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
                : 0,
        };

        // Get filtered statistics (matching current filters)
        const filteredStats = {
            total: reviews.length,
            totalCount, // Total documents matching filter (for pagination)
            averageRating: reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : 0,
            fiveStars: reviews.filter((r) => r.rating === 5).length,
            fourStars: reviews.filter((r) => r.rating === 4).length,
            threeStars: reviews.filter((r) => r.rating === 3).length,
            twoStars: reviews.filter((r) => r.rating === 2).length,
            oneStar: reviews.filter((r) => r.rating === 1).length,
        };

        // Calculate pagination info
        const pagination = {
            currentPage: Math.floor(skip / (limit || 1)) + 1,
            totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
            hasNextPage: skip + reviews.length < totalCount,
            hasPrevPage: skip > 0,
            limit,
            skip,
            totalDocuments: totalCount,
        };

        return NextResponse.json(
            {
                success: true,
                reviews,
                stats, // Overall stats
                filteredStats, // Stats for current filter
                pagination,
                filters: {
                    status: status || "all",
                    productId: productId || null,
                    rating: rating || null,
                    search: search || null,
                    sortBy,
                    sortOrder,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching admin reviews:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch reviews",
                error: error.message,
            },
            { status: 500 }
        );
    }
};


// PATCH - Update review status (for admin)
export const PATCH = async (request) => {
    try {
        const db = await connectDB();
        const reviewsCollection = db.collection("reviews");

        const body = await request.json();
        const { reviewId, status } = body;

        // Validation
        if (!reviewId || !status) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing required fields",
                },
                { status: 400 }
            );
        }

        if (!["pending", "approved", "rejected"].includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid status. Must be 'pending', 'approved', or 'rejected'",
                },
                { status: 400 }
            );
        }
        console.log(reviewId)
        const result = await reviewsCollection.updateOne(
            { _id: new ObjectId(reviewId) },
            {
                $set: {
                    status,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Review not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: `Review ${status} successfully`,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating review:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to update review",
                error: error.message,
            },
            { status: 500 }
        );
    }
};

// DELETE - Delete a review (for admin)
export const DELETE = async (request) => {
    try {
        const db = await connectDB();
        const reviewsCollection = db.collection("reviews");

        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get("reviewId");

        if (!reviewId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Review ID is required",
                },
                { status: 400 }
            );
        }

        const result = await reviewsCollection.deleteOne({
            _id: new ObjectId(reviewId),
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Review not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Review deleted successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to delete review",
                error: error.message,
            },
            { status: 500 }
        );
    }
};