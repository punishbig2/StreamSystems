export enum RunActions {
  Mid = 'mid',
  Spread = 'spread',
  Ofr = 'ofr',
  Bid = 'bid',
  // Other
  SetTable = 'Run.SetTable',
  OfrQtyChanged = 'Run.OfferQuantityChanged',
  BidQtyChanged = 'Run.BidQuantityChanged',
  UpdateBid = 'Run.UpdateBid',
  UpdateDefaultOfrQty = 'Run.UpdateDefaultOfrQty',
  UpdateOffer = 'Run.UpdateOffer',
  UpdateDefaultBidQty = 'Run.UpdateDefaultBidQty',
}
