import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MyReports } from "./MyReports";

beforeEach(() =>
  localStorage.setItem(
    "odormap.tokens",
    JSON.stringify({ accessToken: "a", refreshToken: "r" }),
  ),
);
afterEach(() => vi.unstubAllGlobals());

const area = {
  areaId: "backa-topola",
  name: "Bačka Topola",
  boundary: [],
  languages: ["sr"],
  timezone: "Europe/Belgrade",
  active: true,
};
const report = {
  id: "019a9a3c-6b1e-7000-8000-0000000000bb",
  userId: "019a9a3c-6b1e-7000-8000-0000000000aa",
  areaId: "backa-topola",
  createdAt: "2026-11-24T19:14:00Z",
  observedAt: "2026-11-24T19:14:00Z",
  location: { lat: 45.81, lon: 19.63 },
  strength: 4,
  odorKind: "rotten_meat",
  comment: "Kod škole",
  weather: {
    windSpeedMs: 3.2,
    windDirectionDeg: 315,
    temperatureC: 6,
    humidityPercent: 80,
    pressureHpa: 1015,
  },
};

describe("MyReports", () => {
  it("shows each report with its strength, kind, wind and comment", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        Response.json(url.endsWith("/areas") ? [area] : [report]),
      ),
    );
    render(<MyReports language="sr" />);

    expect(await screen.findByText("Trulo meso")).toBeInTheDocument();
    expect(screen.getByText("Bačka Topola")).toBeInTheDocument();
    expect(screen.getByText("Vetar: 12 km/h, SZ")).toBeInTheDocument();
    expect(screen.getByText("„Kod škole”")).toBeInTheDocument();
  });

  it("says so when there are no reports yet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        Response.json(url.endsWith("/areas") ? [area] : []),
      ),
    );
    render(<MyReports language="sr" />);

    expect(
      await screen.findByText("Još nemaš nijednu prijavu."),
    ).toBeInTheDocument();
  });
});
