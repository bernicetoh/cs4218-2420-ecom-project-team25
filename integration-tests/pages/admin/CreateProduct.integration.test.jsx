import React from "react";
import toast from "react-hot-toast";
import axios from "axios";
import userEvent from "@testing-library/user-event";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
  act,
} from "@testing-library/react";
import { Routes, Route, MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import CreateProduct, {
  CREATE_PRODUCT_STRINGS,
  API_URLS,
} from "../../../pages/admin/CreateProduct";
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

describe("CreateProduct Integration Tests", () => {
  const mockCategories = [{ _id: "1", name: "Electronics" }];
  const MockProducts = () => (
    <div data-testid="mock-products-page">Products Page</div>
  );
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios.get for useCategory hook
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
  });

  const setup = async () => {
    render(
      <Providers>
        <MemoryRouter initialEntries={["/dashboard/admin/create-product"]}>
          <Routes>
            <Route
              path="/dashboard/admin/create-product"
              element={<CreateProduct />}
            />
            <Route
              path="/dashboard/admin/products"
              element={<MockProducts />}
            />
          </Routes>
        </MemoryRouter>
      </Providers>
    );

    await waitFor(() => {
      const categorySelect = screen.getByRole("combobox", {
        name: getCaseInsensitiveRegex(
          CREATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION
        ),
      });
      expect(within(categorySelect).getAllByRole("option")).toHaveLength(
        mockCategories.length
      );
    });
  };

  it("should load categories and display them in dropdown", async () => {
    await setup();

    const categorySelect = await screen.findByRole("combobox", {
      name: getCaseInsensitiveRegex(
        CREATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION
      ),
    });

    expect(categorySelect).toBeInTheDocument();
    const options = within(categorySelect).getAllByRole("option");
    expect(options).toHaveLength(mockCategories.length);
    expect(options[0]).toHaveTextContent(mockCategories[0].name);
  });

  it("should fill and submit the form, calling API and showing success toast", async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    URL.createObjectURL = jest.fn(() => "mock-url");

    await setup();

    const formData = {
      name: "Test Product",
      description: "Test Description",
      price: "100",
      quantity: "5",
      photo: new File(["content"], "test.jpg", { type: "image/jpeg" }),
      category: mockCategories[0]._id,
      shipping: "true",
    };

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.PRODUCT_NAME_PLACEHOLDER
          ),
        }),
        formData.name
      );
      await user.type(
        screen.getByRole("textbox", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.PRODUCT_DESCRIPTION_PLACEHOLDER
          ),
        }),
        formData.description
      );
      await user.type(
        screen.getByRole("spinbutton", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.PRODUCT_PRICE_PLACEHOLDER
          ),
        }),
        formData.price
      );
      await user.type(
        screen.getByRole("spinbutton", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.PRODUCT_QUANTITY_PLACEHOLDER
          ),
        }),
        formData.quantity
      );
      await user.selectOptions(
        screen.getByRole("combobox", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.SELECT_CATEGORY_ACTION
          ),
        }),
        formData.category
      );
      await user.selectOptions(
        screen.getByRole("combobox", {
          name: getCaseInsensitiveRegex(
            CREATE_PRODUCT_STRINGS.SELECT_SHIPPING_ACTION
          ),
        }),
        formData.shipping
      );
      await user.upload(
        screen.getByLabelText(
          getCaseInsensitiveRegex(CREATE_PRODUCT_STRINGS.UPLOAD_PHOTO_ACTION)
        ),
        formData.photo
      );
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-products-page")).toBeInTheDocument(); // user navigated to Products
    });
    expect(toast.success).toHaveBeenCalledWith(
      CREATE_PRODUCT_STRINGS.PRODUCT_CREATED
    );
    expect(axios.post).toHaveBeenCalledWith(
      API_URLS.CREATE_PRODUCT,
      expect.any(FormData)
    );
  });

  it("should show error toast if API responds with unsuccessful creation", async () => {
    axios.post.mockResolvedValue({ data: { success: false } });

    await setup();

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ERROR
      );
    });
  });

  it("should show error toast if API call fails", async () => {
    axios.post.mockRejectedValue(new Error("Network error"));

    await setup();

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ERROR
      );
    });
  });

  it("should display image preview after uploading photo", async () => {
    URL.createObjectURL = jest.fn(() => "mock-url");

    await setup();

    const file = new File(["dummy content"], "example.png", {
      type: "image/png",
    });

    await act(async () => {
      await user.upload(
        screen.getByLabelText(
          getCaseInsensitiveRegex(CREATE_PRODUCT_STRINGS.UPLOAD_PHOTO_ACTION)
        ),
        file
      );
    });

    const img = screen.getByAltText("product_photo");
    expect(img).toHaveAttribute("src", "mock-url");
  });

  it("should show error toast if required fields are empty", async () => {
    await setup();

    fireEvent.click(
      screen.getByRole("button", {
        name: getCaseInsensitiveRegex(
          CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ACTION
        ),
      })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CREATE_PRODUCT_STRINGS.CREATE_PRODUCT_ERROR
      );
    });
  });
});
