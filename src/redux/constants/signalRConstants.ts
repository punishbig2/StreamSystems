export enum SignalRActions {
  // Messages
  SubscribeForMarketData = 'SubscribeForMarketData',
  UnsubscribeFromMarketData = 'UnsubscribeMarketData',
  SubscribeForMBMsg = 'SubscribeForMBMsg',
  UnsubscribeForMBMsg = 'UnsubscribeForMBMsg',
  // Internal
  Disconnected = 'SignalR.Disconnected',
  Connected = 'SignalR.Connected',
  Connecting = 'SignalR.Connecting',
}
