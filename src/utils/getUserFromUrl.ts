export const getUserFromUrl = () => {
  const {location} = window;
  const urlParameters: URLSearchParams = new URLSearchParams(location.search);
  return urlParameters.get('user');
};
