export const getUserFromUrl = (): string | null => {
  const { location } = window;
  const urlParameters: URLSearchParams = new URLSearchParams(location.search);
  return urlParameters.get('user');
};
