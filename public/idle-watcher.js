const startIdleMonitor = (timeout) => {
  console.log("waiting for: " + timeout + "ms");
  const timer = setTimeout(() => {
    self.postMessage({ type: "TIMEOUT" });
  }, timeout);
  return () => {
    clearTimeout(timer);
  };
};

self.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "START") {
    self.reset = startIdleMonitor(message.data);
  } else if (message.type === "USER_ACTION_EVENT") {
    self.reset();
  }
});
