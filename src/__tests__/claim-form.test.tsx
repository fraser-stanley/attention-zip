// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const TEST_WALLET = "0x1234567890123456789012345678901234567890";
const push = vi.fn();
const toast = vi.fn();
const setAddress = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("@/components/toast", () => ({
  useToast: () => ({
    toast,
  }),
}));

vi.mock("@/lib/wallet-context", () => ({
  truncateAddress: (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`,
  useWallet: () => ({
    setAddress,
  }),
}));

import { ClaimForm } from "@/components/claim-form";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("ClaimForm", () => {
  it("submits successfully, stores the wallet, toasts, and redirects", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ wallet: TEST_WALLET }),
    } as Response);

    const user = userEvent.setup();

    render(<ClaimForm claimCode="reef-X4B2" />);

    await user.type(screen.getByLabelText(/wallet address/i), TEST_WALLET);
    await user.click(screen.getByRole("button", { name: /claim agent/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/agents/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        claim_code: "reef-X4B2",
        wallet: TEST_WALLET,
      }),
    });

    await waitFor(() => {
      expect(setAddress).toHaveBeenCalledWith(TEST_WALLET);
      expect(toast).toHaveBeenCalledWith("Claimed 0x1234…7890");
      expect(push).toHaveBeenCalledWith(`/portfolio/${TEST_WALLET}`);
    });
  });

  it("shows the API error when claiming fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "This agent has already been claimed." }),
    } as Response);

    const user = userEvent.setup();

    render(<ClaimForm claimCode="reef-X4B2" />);

    await user.type(screen.getByLabelText(/wallet address/i), TEST_WALLET);
    await user.click(screen.getByRole("button", { name: /claim agent/i }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("This agent has already been claimed.");
    expect(setAddress).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
