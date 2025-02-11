import React from "react";
import { BrowserRouter } from "react-router-dom";
import { render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

// ensure react router context is available
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Categories Page", () => {
  const mockCategories = [
    { _id: "1", name: "Category 1", slug: "category-1" },
    { _id: "2", name: "Category 2", slug: "category-2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render categories in Category page", () => {
    useCategory.mockReturnValueOnce(mockCategories);

    renderWithRouter(<Categories />);

    mockCategories.forEach((category) => {
      const link = screen.getByRole("link", { name: category.name });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", `/category/${category.slug}`);
    });
  });
});
