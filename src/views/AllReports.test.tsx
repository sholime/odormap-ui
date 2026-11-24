import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AllReports } from "./AllReports";

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
const weather = (windDirectionDeg: number) => ({
  windSpeedMs: 3,
  windDirectionDeg,
  temperatureC: 6,
  humidityPercent: 80,
  pressureHpa: 1015,
});
const reports = [
  {
    id: "019a9a3c-6b1e-7000-8000-0000000000b1",
    areaId: "backa-topola",
    observedAt: "2026-11-24T19:14:00Z",
    location: { lat: 45.81, lon: 19.63 },
    strength: 4,
    odorKind: "rotten_meat",
    weather: weather(315),
  },
  {
    id: "019a9a3c-6b1e-7000-8000-0000000000b2",
    areaId: "backa-topola",
    observedAt: "2026-11-23T10:00:00Z",
    location: { lat: 45.81, lon: 19.63 },
    strength: 3,
    odorKind: "pig_manure",
    weather: weather(310),
  },
];

function fakeApi() {
  const fetch = vi.fn(async (url: string) =>
    Response.json(url.endsWith("/areas") ? [area] : reports),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("AllReports", () => {
  it("lists the reports of the first area with totals", async () => {
    const fetch = fakeApi();
    render(<AllReports language="sr" />);

    expect(await screen.findByText("Trulo meso")).toBeInTheDocument();
    expect(screen.getByText("Svinjski stajnjak")).toBeInTheDocument();
    expect(screen.getByText("3,5")).toBeInTheDocument(); // average strength
    expect(screen.getByText("SZ")).toBeInTheDocument(); // most common wind
    expect(String(fetch.mock.calls.at(-1)![0])).toContain(
      "areaId=backa-topola",
    );
  });

  it("can list reports from outside the known areas", async () => {
    const fetch = fakeApi();
    render(<AllReports language="sr" />);
    await screen.findByText("Trulo meso");

    await userEvent.selectOptions(screen.getByLabelText("Područje"), "unknown");

    expect(String(fetch.mock.calls.at(-1)![0])).toContain("areaId=unknown");
  });
});
