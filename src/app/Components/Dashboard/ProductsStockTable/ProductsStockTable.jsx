"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
  Pagination,
} from "@mui/material";
import { AiOutlineFilter, AiOutlineReload } from "react-icons/ai";
import React from "react";

export default function ProductsStockTable({
  products,
  categories,
  totalPages,
  currentPage,
  sortBy,
}) {
  const [page, setPage] = useState(currentPage || 1);
  const [sortOption, setSortOption] = useState(sortBy || "");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // -------------------- Filters --------------------
  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;
    setCategoryFilter(newCategory);
    setPage(1);
    let url = `/dashboard/stock?page=1&category=${newCategory}`;
    if (sortOption) url += `&sortBy=${sortOption}`;
    router.push(url);
  };

  const handleSortChange = (event) => {
    const newSortOption = event.target.value;
    setSortOption(newSortOption);
    setPage(1);
    let url = `/dashboard/stock?page=1&sortBy=${newSortOption}`;
    if (categoryFilter) url += `&category=${categoryFilter}`;
    router.push(url);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    let url = `/dashboard/stock?page=${newPage}`;
    if (sortOption) url += `&sortBy=${sortOption}`;
    if (categoryFilter) url += `&category=${categoryFilter}`;
    router.push(url);
  };

  const handleReset = () => {
    setSortOption("");
    setCategoryFilter("all");
    setPage(1);
    router.push("/dashboard/stock");
  };

  const handleEditProduct = (product) => {
    router.push(`/dashboard/edit-product/${product.id}`);
  };

  // -------------------- Stock helpers --------------------
  const getChipColor = (availability) => {
    if (availability > 10) return "success";
    if (availability > 0) return "secondary";
    return "error";
  };
  const parseStock = (value) => parseInt(value || 0, 10);

  const getProductAvailability = (product) => {
    return product.variants?.reduce((total, variant) => {
      if (!product.sizeType || product.sizeType === "individual") {
        return (
          total +
          (variant.availableSizes?.reduce(
            (sum, s) => sum + parseStock(s.availability),
            0
          ) || 0)
        );
      } else if (product.sizeType === "free") {
        return total + parseStock(variant.freeSize?.availability);
      } else if (product.sizeType === "none") {
        return total + parseStock(variant.noSize?.availability);
      }
      return total;
    }, 0);
  };

  const getVariantTotalStock = (variant, sizeType) => {
    if (!sizeType || sizeType === "individual") {
      return variant.availableSizes?.reduce(
        (sum, s) => sum + parseStock(s.availability),
        0
      );
    } else if (sizeType === "free") {
      return parseStock(variant.freeSize?.availability);
    } else if (sizeType === "none") {
      return parseStock(variant.noSize?.availability);
    }
    return 0;
  };

  return (
    <Card elevation={2}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight="bold">
            Product Stock Inventory
          </Typography>
        }
      />
      <Divider />
      <CardContent>
        {/* -------------------- Filters -------------------- */}
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          justifyContent="space-between"
          alignItems={isMobile ? "flex-start" : "center"}
          sx={{ mb: 3 }}
        >
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems={isMobile ? "flex-start" : "center"}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <AiOutlineFilter size={16} color="text.secondary" />
              <Typography variant="body2" fontWeight="medium">
                Filters:
              </Typography>
            </Stack>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-label">Sort by</InputLabel>
              <Select
                labelId="sort-label"
                value={sortOption}
                label="Sort by"
                onChange={handleSortChange}
              >
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="oldest">Oldest</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                value={categoryFilter}
                label="Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories?.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Button
            variant="outlined"
            size="small"
            onClick={handleReset}
            startIcon={<AiOutlineReload size={16} />}
          >
            Reset Filters
          </Button>
        </Stack>

        {/* -------------------- Table -------------------- */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            maxWidth: "100%",
            overflowX: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            maxHeight: 600,
          }}
        >
          <Table size="medium">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: "background.paper",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                <TableCell>Product Name</TableCell>
                <TableCell align="center">Total Stock</TableCell>
                <TableCell align="center">Variant ID</TableCell>
                <TableCell align="center">Image</TableCell>
                <TableCell align="center">Sizes Stock</TableCell>
                <TableCell align="center">Variant Total</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {products?.map((product) => {
                const totalStock = getProductAvailability(product);

                return (
                  <React.Fragment key={product.id}>
                    {/* Parent Product Row */}
                    <TableRow sx={{ backgroundColor: "grey.100" }}>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {product?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product?.id}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={totalStock}
                          color={getChipColor(totalStock)}
                          size="small"
                          variant={totalStock === 0 ? "outlined" : "filled"}
                          sx={{ minWidth: 50, fontWeight: "bold" }}
                        />
                      </TableCell>
                      <TableCell colSpan={4}></TableCell>
                    </TableRow>

                    {/* Variant Rows */}
                    {product.variants?.map((variant) => {
                      const variantTotal = getVariantTotalStock(
                        variant,
                        product.sizeType
                      );

                      return (
                        <TableRow key={variant.productId}>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell>{variant.productId}</TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                position: "relative",
                                width: 48,
                                height: 48,
                                borderRadius: 1,
                                overflow: "hidden",
                                mx: "auto",
                              }}
                            >
                              <Image
                                src={variant?.images?.[0] || "/placeholder.svg"}
                                alt={variant.productId}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {(!product.sizeType ||
                              product.sizeType === "individual") && (
                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                justifyContent="center"
                              >
                                {variant.availableSizes?.map((s, idx) => (
                                  <Chip
                                    key={idx}
                                    label={`${s.size}: ${s.availability}`}
                                    color={getChipColor(s.availability)}
                                    size="small"
                                    variant={
                                      s.availability === 0
                                        ? "outlined"
                                        : "filled"
                                    }
                                  />
                                ))}
                              </Stack>
                            )}
                            {product.sizeType === "free" && (
                              <Chip
                                label={`Free: ${
                                  variant.freeSize?.availability || 0
                                }`}
                                color={getChipColor(
                                  variant.freeSize?.availability || 0
                                )}
                                size="small"
                                variant={
                                  (variant.freeSize?.availability || 0) === 0
                                    ? "outlined"
                                    : "filled"
                                }
                              />
                            )}
                            {product.sizeType === "none" && (
                              <Chip
                                label={`Stock: ${
                                  variant.noSize?.availability || 0
                                }`}
                                color={getChipColor(
                                  variant.noSize?.availability || 0
                                )}
                                size="small"
                                variant={
                                  (variant.noSize?.availability || 0) === 0
                                    ? "outlined"
                                    : "filled"
                                }
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={variantTotal}
                              color={getChipColor(variantTotal)}
                              size="small"
                              variant={
                                variantTotal === 0 ? "outlined" : "filled"
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleEditProduct(product)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            shape="rounded"
            color="primary"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
}
