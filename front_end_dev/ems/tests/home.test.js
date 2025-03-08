import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from 'react-dom/test-utils'; // Import act

import Home from "../src/pages/FrontPage/home";
import { BrowserRouter as Router } from "react-router-dom";

// Mock window.scrollTo
beforeAll(() => {
  jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterAll(() => {
  window.scrollTo.mockRestore();
});

describe("Home Component", () => {
  const renderWithRouter = (component) => {
    return render(<Router>{component}</Router>);
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders the component", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ loggedIn: false }),
    });
    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.getByAltText("Share-Care Logo")).toBeInTheDocument();
      expect(screen.getByText("SHARE-CARE")).toBeInTheDocument();
    });
  });

  test("displays logged-in user profile", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ loggedIn: true, user: { role: "admin" } }),
    });
    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
  });

  test("displays events correctly", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ loggedIn: false }),
    });
    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Foster for Kitten or Cat")).toBeInTheDocument();
      expect(screen.getByText("Save the World")).toBeInTheDocument();
    });
  });

  test("handles logout correctly", async () => {
    // Initial logged-in state
    global.fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ loggedIn: true, user: { role: "admin" } }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ loggedIn: false }),
      });

    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Profile")).toBeInTheDocument();
    });

    await act(async () => {
      const logoutButton = screen.getByText("Logout");
      fireEvent.click(logoutButton);
    });

    await waitFor(() => {
      expect(screen.queryByText("Profile")).not.toBeInTheDocument();
      expect(screen.queryByText("Logout")).not.toBeInTheDocument();
      expect(screen.getByText("Login")).toBeInTheDocument();
    });
  });

  test("renders Donate Now button", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ loggedIn: false }),
    });
    renderWithRouter(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Donate Now!")).toBeInTheDocument();
    });
  });

  test("handles contact button click", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ loggedIn: false }),
    });
    renderWithRouter(<Home />);
    const contactButton = screen.getByRole("button", { name: "Contact Us" });
    await act(async () => {
      fireEvent.click(contactButton);
    });
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({
        top: expect.any(Number),
        behavior: "smooth",
      })
    );
  });
});