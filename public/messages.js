self.importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.0/signalr.min.js"
);

const { location } = self;

const hostname = location.hostname;
const baseUrl = location.protocol + "//" + hostname;

const lib = signalR;

const createConnection = () =>
  new lib.HubConnectionBuilder()
    .withUrl(
      `${baseUrl}:4050/liveUpdateSignalRHub`,
      lib.HttpTransportType.WebSockets
    )
    .configureLogging(lib.LogLevel.Error)
    .build();

const main = () => {
  this.cache = [];
  this.timer = setTimeout(() => {}, 0);

  const onMessage = (message) => {
    clearTimeout(this.timer);

    this.cache = [JSON.parse(message), ...this.cache];
    this.timer = setTimeout(() => {
      postMessage(this.cache);
      this.cache = [];
    }, 200);
  };
  const connection = createConnection();
  // this.installHealthMonitors(newConnection);
  const initialize = () => {
    connection.on("updateMessageBlotter", onMessage);
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
