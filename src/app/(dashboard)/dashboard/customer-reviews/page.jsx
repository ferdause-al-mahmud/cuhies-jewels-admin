"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 0,
  });
  const [filteredStats, setFilteredStats] = useState({
    total: 0,
    averageRating: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchReviews();
  }, [
    filterStatus,
    filterRating,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
  ]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterRating !== "all") params.append("rating", filterRating);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("limit", itemsPerPage.toString());
      params.append("skip", ((currentPage - 1) * itemsPerPage).toString());

      const response = await fetch(`/api/reviews?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      setReviews(data.reviews || []);
      setStats(
        data.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          averageRating: 0,
        }
      );
      setFilteredStats(data.filteredStats || {});
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on search
    fetchReviews();
  };

  const updateReviewStatus = async (reviewId, newStatus) => {
    const updatePromise = async () => {
      const response = await fetch("/api/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update review");

      await fetchReviews();
      return `Review ${newStatus} successfully`;
    };

    toast.promise(updatePromise(), {
      loading: "Updating review...",
      success: (msg) => msg,
      error: "Failed to update review",
    });
  };

  const deleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    const deletePromise = async () => {
      const response = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete review");

      await fetchReviews();
      return "Review deleted successfully";
    };

    toast.promise(deletePromise(), {
      loading: "Deleting review...",
      success: (msg) => msg,
      error: "Failed to delete review",
    });
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold border ${
          styles[status] || styles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Reviews Management
      </h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Total Reviews
          </h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Approved</h3>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Avg Rating
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {stats.averageRating} ⭐
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rating
            </label>
            <select
              value={filterRating}
              onChange={(e) => {
                setFilterRating(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Last Updated</option>
              <option value="rating">Rating</option>
              <option value="reviewerName">Reviewer Name</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reviews by text or reviewer name..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
                fetchReviews();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Filtered Statistics */}
      {(filterStatus !== "all" || filterRating !== "all" || searchTerm) && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Filtered Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {filteredStats.total}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {filteredStats.averageRating} ⭐
              </p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {filteredStats.fiveStars}
              </p>
              <p className="text-sm text-gray-600">5 Stars</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {filteredStats.fourStars}
              </p>
              <p className="text-sm text-gray-600">4 Stars</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {filteredStats.threeStars}
              </p>
              <p className="text-sm text-gray-600">3 Stars</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {filteredStats.twoStars + filteredStats.oneStar}
              </p>
              <p className="text-sm text-gray-600">≤2 Stars</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <p className="text-gray-500 text-lg">No reviews found</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {review.reviewerName}
                      </h3>
                      <StatusBadge status={review.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span>Product ID: {review.productId}</span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap justify-end">
                    {review.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            updateReviewStatus(review._id, "approved")
                          }
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold text-sm"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() =>
                            updateReviewStatus(review._id, "rejected")
                          }
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold text-sm"
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}
                    {review.status === "approved" && (
                      <button
                        onClick={() =>
                          updateReviewStatus(review._id, "rejected")
                        }
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold text-sm"
                      >
                        Reject
                      </button>
                    )}
                    {review.status === "rejected" && (
                      <button
                        onClick={() =>
                          updateReviewStatus(review._id, "approved")
                        }
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold text-sm"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(review._id)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {review.reviewText}
                </p>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 hover:scale-110 transition-transform cursor-pointer"
                        onClick={() => window.open(image, "_blank")}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  pagination.totalDocuments
                )}{" "}
                of {pagination.totalDocuments} reviews
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            currentPage === page
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 py-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Next
                </button>
              </div>

              <div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReviewsPage;
