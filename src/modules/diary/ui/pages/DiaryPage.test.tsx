import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DiaryPage from "./DiaryPage";

vi.mock("../components/DiaryModal", () => ({
  default: ({
    isOpen,
    initialPhotos,
  }: {
    isOpen: boolean;
    initialPhotos?: string[];
  }) => (isOpen ? <div data-testid="diary-modal">photos:{initialPhotos?.length ?? 0}</div> : null),
}));

describe("DiaryPage", () => {
  it("passes existing photos into the diary modal when editing from the list", async () => {
    render(
      <DiaryPage
        fullEntries={[{
          id: "entry-1",
          user_id: "user-a",
          week_index: 4,
          content: "Remember this week",
          photos: ["photo-1.jpg", "photo-2.jpg"],
          created_at: "2026-04-01T00:00:00.000Z",
          updated_at: "2026-04-01T00:00:00.000Z",
        }]}
        diaryEntries={{ "4": "Remember this week" }}
        birthdate="1990-01-01"
        userId="user-a"
        mode="zen"
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Remember this week"));

    expect(await screen.findByTestId("diary-modal")).toHaveTextContent("photos:2");
  });
});
