export const getUserIdFromUrl = (): string | null => {
  const { location, history } = window;
  if (history.state) {
    const { userId } = history.state;
    if (!userId) {
      const urlParameters: URLSearchParams = new URLSearchParams(
        location.search
      );
      return urlParameters.get("user");
    } else {
      return userId;
    }
  } else {
    const urlParameters: URLSearchParams = new URLSearchParams(location.search);
    return urlParameters.get("user");
  }
};
