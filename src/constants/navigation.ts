export const ROUTES = {
  vault: "/archive",
  capture: "/capture",
  rediscover: "/rediscover",
  chamber: "/chamber",
} as const;

export const ARTIFACT_RECORD_PATH = "/artifact/:id";
export const ARTIFACT_ROUTE_PREFIX = "/artifact/";

export const PRIMARY_NAV_ITEMS = [
  { label: "Vault", route: ROUTES.vault },
  { label: "Capture", route: ROUTES.capture },
  { label: "Rediscover", route: ROUTES.rediscover },
] as const;

export const getArtifactRoute = (id: string) => `${ARTIFACT_ROUTE_PREFIX}${id}`;

export const isPrimaryNavActive = (pathname: string, route: string) => {
  if (route === ROUTES.vault) {
    return pathname === ROUTES.vault || pathname.startsWith(ARTIFACT_ROUTE_PREFIX);
  }

  return pathname === route;
};
