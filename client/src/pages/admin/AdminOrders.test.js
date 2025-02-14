import React from "react";
import toast from "react-hot-toast";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

import AdminOrders, { ADMIN_ORDERS_STRINGS, API_URLS } from "./AdminOrders";
import { useAuth } from "../../context/auth";

// Mock dependencies
jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock("antd", () => {
  const actualAntd = jest.requireActual("antd"); // Keep other Antd components working
  const MockSelect = ({
    children,
    onChange,
    "data-testid": testId,
    defaultValue,
  }) => (
    <select
      data-testid={testId}
      defaultValue={defaultValue}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );

  MockSelect.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );

  return {
    ...actualAntd,
    Select: MockSelect,
  };
});

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Mock AdminMenu</div>
));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

describe("AdminOrders Component", () => {
  const mockAuthData = {
    user: { name: "Admin User" },
    token: "valid-token",
  };
  const mockOrders = [
    {
      _id: "1",
      status: "Processing",
      buyer: { name: "John Doe" },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        {
          _id: "p1",
          name: "Product 1",
          description: "Product Description 1",
          price: 100,
        },
      ],
    },
    {
      _id: "2",
      status: "Not Process",
      buyer: { name: "Jane Doe" },
      createAt: new Date().toISOString(),
      payment: { success: false },
      products: [
        {
          _id: "p2",
          name: "Product 2",
          description: "Product Description 2",
          price: 200,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display orders when authenticated", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    // Wait and assert for the orders to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("admin-orders-list")).queryAllByTestId(
          /admin-order-item-/
        )
      ).toHaveLength(mockOrders.length)
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_ALL_ORDERS);
  });

  it("should display no orders message when there are no orders", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<AdminOrders />);

    // Wait and assert that there are no orders displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("admin-orders-list")).queryAllByTestId(
          /admin-order-item-/
        )
      ).toHaveLength(0)
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_ALL_ORDERS);
  });

  it("should not fetch orders when not authenticated", async () => {
    useAuth.mockReturnValue([
      {
        user: null,
        token: "",
      },
    ]);
    render(<AdminOrders />);

    // Wait and assert that there are no orders displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("admin-orders-list")).queryAllByTestId(
          /admin-order-item-/
        )
      ).toHaveLength(0)
    );
    expect(axios.get).not.toHaveBeenCalled(); // axios.get should not be called when not authenticated
  });

  it("should display error message on failed get orders", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    const mockError = new Error("Failed to fetch orders");
    axios.get.mockRejectedValue(mockError);

    render(<AdminOrders />);

    // Wait and assert that there are no orders displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("admin-orders-list")).queryAllByTestId(
          /admin-order-item-/
        )
      ).toHaveLength(0)
    );
    expect(axios.get).toHaveBeenCalledWith(API_URLS.GET_ALL_ORDERS);
    expect(toast.error).toHaveBeenCalledWith(
      ADMIN_ORDERS_STRINGS.FETCH_ORDERS_ERROR
    );
  });

  it("should handle order status change", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<AdminOrders />);

    // Wait for the orders to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("admin-orders-list")).queryAllByTestId(
          /admin-order-item-/
        )
      ).toHaveLength(mockOrders.length)
    );

    const newShippingStatus = "Shipped";
    const select = screen.getByTestId(`status-${mockOrders[0]._id}`);
    userEvent.selectOptions(select, newShippingStatus);

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        `${API_URLS.UPDATE_ORDER_STATUS}/${mockOrders[0]._id}`,
        { status: newShippingStatus }
      )
    );
  });

  it("should handle failure in order status change", async () => {
    useAuth.mockReturnValue([mockAuthData]);
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce(new Error("Failed to update order status"));

    render(<AdminOrders />);

    // Wait for the orders to be displayed
    await waitFor(() =>
      expect(
        within(screen.getByTestId("admin-orders-list")).queryAllByTestId(
          /admin-order-item-/
        )
      ).toHaveLength(mockOrders.length)
    );

    const newShippingStatus = "Shipped";
    const select = screen.getByTestId(`status-${mockOrders[0]._id}`);
    userEvent.selectOptions(select, newShippingStatus);

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        `${API_URLS.UPDATE_ORDER_STATUS}/${mockOrders[0]._id}`,
        { status: newShippingStatus }
      )
    );
    expect(toast.error).toHaveBeenCalledWith(
      ADMIN_ORDERS_STRINGS.UPDATE_STATUS_ERROR
    );
  });
});
