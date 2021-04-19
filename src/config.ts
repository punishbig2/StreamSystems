const { location } = window;
const hostname: string = location.hostname;
const baseUrl: string = location.protocol + "//" + hostname;
// Replace the second item of the host name
const parts: string[] = hostname.split(".");
const accountUrl: string =
  location.protocol +
  "//" +
  [...parts.slice(0, -3), "account", ...parts.slice(-2)].join(".");

export default {
  BackendUrl: `${baseUrl}:4050`,
  SignOutUrl: accountUrl,
  PricerUrl: `${baseUrl}:4020/api/pricer/query`,
  CalendarServiceBaseUrl: `${baseUrl}:4080`,
  PrePricerUrl: `${baseUrl}:4020/api`,
  RequestTimeout: 10000,
  IdleTimeout: -1,
  GetRoleEndpoint: accountUrl + "/api/user/getrole",
  RedirectTimeout: -1,
};
