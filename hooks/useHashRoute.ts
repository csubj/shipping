import { useEffect, useState } from "react";

export type RouteName = "graph" | "table" | "factions" | "settings";

const ROUTES: RouteName[] = ["graph", "table", "factions", "settings"];

function parseHash(): RouteName {
  const h = window.location.hash.replace(/^#\/?/, "").split("/")[0];
  return (ROUTES as string[]).includes(h) ? (h as RouteName) : "graph";
}

export function useHashRoute(): [RouteName, (r: RouteName) => void] {
  const [route, setRoute] = useState<RouteName>(() => parseHash());

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = (r: RouteName) => {
    window.location.hash = `#/${r}`;
  };
  return [route, navigate];
}
