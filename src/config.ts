const { location } = window;
const hostname: string = location.hostname;

const IP_ADDRESS_REGEXP =
  // eslint-disable-next-line max-len
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const isLocalUrl = (hostname: string): boolean => {
  if (hostname === 'localhost') {
    return true;
  }

  return IP_ADDRESS_REGEXP.test(hostname);
};

const baseUrl = isLocalUrl(hostname)
  ? process.env.REACT_APP_BASE_URL
  : `${location.protocol}//${hostname}`;

const accountHostname = isLocalUrl(hostname)
  ? process.env.REACT_APP_ACCOUNT_HOST
  : hostname.replace('trading', 'account');

const accountUrl = `${location.protocol}//${accountHostname}`;

export default {
  BackendUrl: baseUrl,
  SignOutUrl: accountUrl,
  PricerUrl: `${baseUrl}:4020/api/pricer/query`,
  CalendarServiceBaseUrl: `${baseUrl}:4080`,
  PrePricerUrl: `${baseUrl}:4020/api`,
  RequestTimeout: 10000,
  IdleTimeout: -1,
  GetRoleEndpoint: `${accountUrl}/api/user/getrole`,
  RedirectTimeout: -1,
  Environment: process.env.REACT_APP_ENV,
};
