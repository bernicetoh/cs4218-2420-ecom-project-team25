import React from "react";
import toast from "react-hot-toast";
import axios from "axios";
import userEvent from "@testing-library/user-event";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import UpdateProduct, {
  API_URLS,
  UPDATE_PRODUCT_STRINGS,
} from "../../../pages/admin/UpdateProduct";
import { API_URLS as CATEGORY_API_URLS } from "../../../hooks/useCategory";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";

jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

jest.mock("axios");

jest.mock("antd", () => {
  const MockSelect = ({
    children,
    onChange,
    defaultValue,
    value,
    "aria-label": ariaLabel,
  }) => (
    <select
      defaultValue={defaultValue}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    >
      {children}
    </select>
  );
  MockSelect.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  const MockBadge = ({ children }) => <div>{children}</div>;
  return { Select: MockSelect, Badge: MockBadge };
});

Object.defineProperty(window, "matchMedia", {
  value: jest.fn(() => {
    return {
      matches: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  }),
});
URL.createObjectURL = jest.fn().mockReturnValue("test-url");

const Providers = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>{children}</SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

function getCaseInsensitiveRegex(text) {
  return new RegExp(text, "i");
}

describe("UpdateProduct Integration Tests", () => {
  const mockCategories = [
    { _id: "1", name: "Category1" },
    { _id: "2", name: "Category2" },
  ];

  const mockProduct = {
    _id: "123",
    name: "Test Product",
    description: "Test Description",
    price: 100,
    quantity: 5,
    shipping: true,
    category: mockCategories[0],
  };

  const paramsSlug = "test-product";

  const MockProductsPage = () => (
    <div data-testid="mock-products-page">Products Page</div>
  );

  const setup = async () => {
    render(
      <Providers>
        <MemoryRouter
          initialEntries={[`/dashboard/admin/update-product/${paramsSlug}`]}
        >
          <Routes>
            <Route
              path="/dashboard/admin/update-product/:slug"
              element={<UpdateProduct />}
            />
            <Route
              path="/dashboard/admin/products"
              element={<MockProductsPage />}
            />
          </Routes>
        </MemoryRouter>
      </Providers>
    );

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      ).toHaveValue(mockProduct.name)
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url === CATEGORY_API_URLS.GET_CATEGORIES) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url === `${API_URLS.GET_PRODUCT}/${paramsSlug}`) {
        return Promise.resolve({
          data: { success: true, product: mockProduct },
        });
      }
      return Promise.reject(new Error("Not Found"));
    });
  });

  it("should load categories and display them in dropdown", async () => {
    await setup();

    const categorySelect = await screen.findByRole("combobox", {
      name: getCaseInsensitiveRegex(
        UPDATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION
      ),
    });

    expect(categorySelect).toBeInTheDocument();
    const options = within(categorySelect).getAllByRole("option");
    expect(options).toHaveLength(mockCategories.length);
    expect(options[0]).toHaveTextContent(mockCategories[0].name);
  });

  it("should update product and navigate", async () => {
    const user = userEvent.setup();
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    const inputFormData = {
      name: "Updated Product",
      description: "Updated Description",
      price: "200",
      quantity: "10",
      photo: new File(["dummy content"], "test-photo.jpg", {
        type: "image/jpeg",
      }),
      category: mockCategories[1]._id,
      shipping: "false",
    };

    await setup();

    await act(async () => {
      await user.clear(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        })
      );
      await user.type(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        }),
        inputFormData.name
      );

      await user.clear(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_DESCRIPTION_PLACEHOLDER
          ),
        })
      );
      await user.type(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_DESCRIPTION_PLACEHOLDER
          ),
        }),
        inputFormData.description
      );

      await user.clear(
        screen.getByRole("spinbutton", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_PRICE_PLACEHOLDER
          ),
        })
      );
      await user.type(
        screen.getByRole("spinbutton", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_PRICE_PLACEHOLDER
          ),
        }),
        inputFormData.price
      );

      await user.clear(
        screen.getByRole("spinbutton", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_QUANTITY_PLACEHOLDER
          ),
        })
      );
      await user.type(
        screen.getByRole("spinbutton", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.PRODUCT_QUANTITY_PLACEHOLDER
          ),
        }),
        inputFormData.quantity
      );

      await user.selectOptions(
        screen.getByRole("combobox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION
          ),
        }),
        inputFormData.category
      );

      await user.selectOptions(
        screen.getByRole("combobox", {
          name: getCaseInsensitiveRegex(
            UPDATE_PRODUCT_STRINGS.SELECT_SHIPPING_ACTION
          ),
        }),
        inputFormData.shipping
      );

      await user.upload(
        screen.getByLabelText(
          getCaseInsensitiveRegex(UPDATE_PRODUCT_STRINGS.UPLOAD_PHOTO_ACTION)
        ),
        inputFormData.photo
      );
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-products-page")).toBeInTheDocument();
    });
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URLS.UPDATE_PRODUCT}/${mockProduct._id}`,
      expect.any(FormData)
    );
    expect(toast.success).toHaveBeenCalledWith(
      UPDATE_PRODUCT_STRINGS.PRODUCT_UPDATED
    );
    const actualFormData = axios.put.mock.calls[0][1];
    expect(actualFormData.get("name")).toBe(inputFormData.name);
    expect(actualFormData.get("description")).toBe(inputFormData.description);
    expect(actualFormData.get("price")).toBe(inputFormData.price);
    expect(actualFormData.get("quantity")).toBe(inputFormData.quantity);
    expect(actualFormData.get("category")).toBe(inputFormData.category);
    expect(actualFormData.get("shipping")).toBe(inputFormData.shipping);
    expect(actualFormData.get("photo")).toStrictEqual(inputFormData.photo);
    expect(actualFormData.get("photo").name).toBe(inputFormData.photo.name);
    expect(actualFormData.get("photo").type).toBe(inputFormData.photo.type);
  });

  it("should delete product and navigate", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    window.prompt = jest.fn().mockReturnValue(true);

    await setup();

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-products-page")).toBeInTheDocument();
    });
    expect(toast.success).toHaveBeenCalledWith(
      UPDATE_PRODUCT_STRINGS.PRODUCT_DELETED
    );
  });

  it("should handle failed update", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: false } });

    await setup();

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.UPDATE_PRODUCT_ERROR
      );
    });
    expect(screen.queryByTestId("mock-products-page")).not.toBeInTheDocument();
  });

  it("should handle failed delete", async () => {
    axios.get.mockResolvedValueOnce({
      data: { product: mockProduct, success: true },
    });
    axios.delete.mockResolvedValueOnce({ data: { success: false } });
    window.prompt = jest.fn().mockReturnValue(true);

    await setup();

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ERROR
      );
    });
    expect(screen.queryByTestId("mock-products-page")).not.toBeInTheDocument();
  });

  it("should not delete product if canceled", async () => {
    window.prompt = jest.fn().mockReturnValue(false);

    setup();

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          UPDATE_PRODUCT_STRINGS.DELETE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() => expect(window.prompt).toHaveBeenCalled());
    expect(axios.delete).not.toHaveBeenCalled();
  });

  it("should handle failed get product", async () => {
    axios.get.mockImplementation((url) => {
      if (url === CATEGORY_API_URLS.GET_CATEGORIES) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url === `${API_URLS.GET_PRODUCT}/${paramsSlug}`) {
        return Promise.resolve({
          data: { success: false },
        });
      }
      return Promise.reject(new Error("Not Found"));
    });

    setup();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        UPDATE_PRODUCT_STRINGS.FETCH_PRODUCT_ERROR
      );
    });
    expect(screen.queryByTestId("mock-products-page")).not.toBeInTheDocument();
  });
});
