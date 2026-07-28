import { create } from "zustand";

interface RouteStore {
  query: string;
  geographicResult: unknown;
  routeOptionsResult: unknown;

  setQuery: (query: string) => void;
  setGeographicResult: (result: unknown) => void;
  setRouteOptionsResult: (result: unknown) => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  query: "",
  geographicResult: null,
  routeOptionsResult: null,

  setQuery: (query) =>
    set({
      query,
    }),

  setGeographicResult: (result) =>
    set({
      geographicResult: result,
    }),

  setRouteOptionsResult: (result) =>
    set({
      routeOptionsResult: result,
    }),
}));