export const getUserFromUrl = (): string | null => {
  const { location, history } = window;
  if (history.state) {
    const { email } = history.state;
    if (!email) {
      const urlParameters: URLSearchParams = new URLSearchParams(
        location.search
      );
      return urlParameters.get("user");
    } else {
      return email;
    }
  } else {
    const urlParameters: URLSearchParams = new URLSearchParams(location.search);
    return urlParameters.get("user");
  }
};
