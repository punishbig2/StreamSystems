export enum SignalRActions {
  // Messages
  SubscribeForMarketData = 'SubscribeForMarketData',
  UnsubscribeFromMarketData = 'UnsubscribeForMarketData',
  SubscribeForMBMsg = 'SubscribeForMBMsg',
  UnsubscribeForMBMsg = 'UnsubscribeForMBMsg',
  // Internal
  Disconnected = 'SignalR.Disconnected',
  Connected = 'SignalR.Connected',
}
