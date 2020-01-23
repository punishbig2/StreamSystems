export enum SignalRActions {
  // Messages
  SubscribeForMarketData = "SubscribeForMarketData",
  UnsubscribeFromMarketData = "UnsubscribeForMarketData",
  SubscribeForMBMsg = "SubscribeForMBMsg",
  UnsubscribeForMBMsg = "UnsubscribeForMBMsg",
  SubscribeForDarkPoolPx = "SubscribeForDarkPoolPx",
  UnsubscribeForDarkPoolPx = "UnsubscribeForDarkPoolPx",
  // Internal
  Disconnected = "SignalR.Disconnected",
  Connected = "SignalR.Connected"
}
