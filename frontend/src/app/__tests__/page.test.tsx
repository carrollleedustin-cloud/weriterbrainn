import { render, screen } from "@testing-library/react";
import Home from "../page";

describe("Home", () => {
  it("renders heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /Personal AI Brain/i })).toBeInTheDocument();
  });

  it("renders links to features", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /AI Chat/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Memory Explorer/i })).toBeInTheDocument();
  });
});
