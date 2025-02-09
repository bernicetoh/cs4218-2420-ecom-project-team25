import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/auth";

// Mock dependencies
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Mock AdminMenu</div>
));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

describe("AdminDashboard Component", () => {
  it("should display admin details when authenticated", () => {
    const mockAuthData = {
      user: {
        name: "Admin User",
        email: "admin@example.com",
        phone: "1234567890",
      },
      token: "valid-token",
    };
    useAuth.mockReturnValue([mockAuthData]);

    render(<AdminDashboard />);

    // Expect the AdminMenu component to be rendered with the correct props
    expect(screen.getByText("Admin Name : Admin User")).toBeInTheDocument();
    expect(
      screen.getByText("Admin Email : admin@example.com")
    ).toBeInTheDocument();
    expect(screen.getByText("Admin Contact : 1234567890")).toBeInTheDocument();
  });

  it("should not crash when user is not authenticated", () => {
    useAuth.mockReturnValue([{ user: null, token: null }]);

    render(<AdminDashboard />);

    // Expect the AdminMenu component to be rendered with empty props
    expect(screen.getByText("Admin Name :")).toBeInTheDocument();
    expect(screen.getByText("Admin Email :")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact :")).toBeInTheDocument();
  });
});
