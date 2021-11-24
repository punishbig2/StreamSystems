// eslint-disable-next-line no-restricted-globals
self.importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.0/signalr.min.js"
);

// eslint-disable-next-line no-undef
const lib = signalR;

const createConnection = () =>
  new lib.HubConnectionBuilder()
    .withUrl(
      `http://localhost:4050/liveUpdateSignalRHub`,
      lib.HttpTransportType.WebSockets
    )
    .configureLogging(lib.LogLevel.Error)
    .build();

const main = () => {
  const onUpdateMarketData = (message) => {
    console.log(message);
  };
  const onUpdateDarkPoolPrice = (message) => {
    console.log(message);
  };
  const onClearDarkPoolPrice = (message) => {
    console.log(message);
  };
  const onRefAllComplete = (message) => {
    console.log(message);
  };
  const connection = createConnection();
  // this.installHealthMonitors(newConnection);
  const initialize = () => {
    connection.on("updateMarketData", onUpdateMarketData);
    connection.on("updateDarkPoolPx", onUpdateDarkPoolPrice);
    connection.on("clearDarkPoolPx", onClearDarkPoolPrice);
    connection.on("refAllComplete", onRefAllComplete);
    connection.invoke("SubscribeForMBMsg", "*");
  };

  connection
    .start()
    .then(() => {
      // Listen to installed combinations
      setTimeout(() => {
        if (connection.state === lib.HubConnectionState.Connected) {
          initialize();
        }
      }, 0);
    })
    .catch(console.error);
};

main();
