const { location } = window;
const hostname: string = location.hostname;
const baseUrl: string = location.protocol + "//" + hostname;
// Replace the second item of the host name
const parts: string[] = hostname.split(".");

const IP_ADDRESS_REGEXP =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const isLocalOrLAN = (hostname: string): boolean => {
  if (hostname === "localhost") {
    return true;
  }

  return IP_ADDRESS_REGEXP.test(hostname);
};

const accountUrlBase = isLocalOrLAN(hostname)
  ? `${hostname}:8822`
  : [...parts.slice(0, -3), "account", ...parts.slice(-2)].join(".");

const accountUrl: string = `${location.protocol}//${accountUrlBase}`;

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
  Environment: process.env.REACT_APP_ENV,
};
