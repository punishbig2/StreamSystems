import {RunActions} from 'components/Run/enumerator';

const spreadMidBid = (mid: number, bid: number): number => 2 * (mid - bid);
const spreadMidOffer = (mid: number, offer: number): number => 2 * (offer - mid);
const spreadBidOffer = (bid: number, offer: number): number => offer - bid;

const midSpreadBid = (spread: number, bid: number): number => (spread + 2 * bid) / 2;
const midSpreadOffer = (spread: number, offer: number): number => (2 * offer - spread) / 2;
const midBidOffer = (bid: number, offer: number): number => (offer + bid) / 2;

const offerSpreadMid = (spread: number, mid: number) => mid + spread / 2;
const offerSpreadBid = (spread: number, bid: number) => bid + spread;
const offerBidMid = (bid: number, mid: number) => 2 * mid - bid;

const bidSpreadMid = (spread: number, mid: number) => mid - spread / 2;
const bidSpreadOffer = (spread: number, offer: number) => offer - spread;
const bidOfferMid = (offer: number, mid: number) => 2 * mid - offer;

export const functionMap: { [k1: string]: { [k2: string]: { [k3: string]: (v1: number, v2: number) => number } } } = {
  [RunActions.Spread]: {
    [RunActions.Mid]: {
      [RunActions.Bid]: (mid: number, bid: number) => spreadMidBid(mid, bid),
      [RunActions.Offer]: (mid: number, offer: number) => spreadMidOffer(mid, offer),
    },
    [RunActions.Bid]: {
      [RunActions.Mid]: (bid: number, mid: number) => spreadMidBid(mid, bid),
      [RunActions.Offer]: (bid: number, offer: number) => spreadBidOffer(bid, offer),
    },
    [RunActions.Offer]: {
      [RunActions.Mid]: (offer: number, mid: number) => spreadMidOffer(mid, offer),
      [RunActions.Bid]: (offer: number, bid: number) => spreadBidOffer(bid, offer),
    },
  },
  [RunActions.Mid]: {
    [RunActions.Spread]: {
      [RunActions.Bid]: (spread: number, bid: number) => midSpreadBid(spread, bid),
      [RunActions.Offer]: (spread: number, offer: number) => midSpreadOffer(spread, offer),
    },
    [RunActions.Bid]: {
      [RunActions.Spread]: (bid: number, spread: number) => midSpreadBid(spread, bid),
      [RunActions.Offer]: (bid: number, offer: number) => midBidOffer(bid, offer),
    },
    [RunActions.Offer]: {
      [RunActions.Spread]: (offer: number, spread: number) => midSpreadOffer(spread, offer),
      [RunActions.Bid]: (offer: number, bid: number) => midBidOffer(bid, offer),
    },
  },
  [RunActions.Offer]: {
    [RunActions.Spread]: {
      [RunActions.Mid]: (spread: number, mid: number) => offerSpreadMid(spread, mid),
      [RunActions.Bid]: (spread: number, bid: number) => offerSpreadBid(spread, bid),
    },
    [RunActions.Bid]: {
      [RunActions.Mid]: (bid: number, mid: number) => offerBidMid(bid, mid),
      [RunActions.Spread]: (bid: number, spread: number) => offerSpreadBid(spread, bid),
    },
    [RunActions.Mid]: {
      [RunActions.Bid]: (mid: number, bid: number) => offerBidMid(bid, mid),
      [RunActions.Spread]: (mid: number, spread: number) => offerSpreadMid(spread, mid),
    },
  },
  [RunActions.Bid]: {
    [RunActions.Spread]: {
      [RunActions.Mid]: (spread: number, mid: number) => bidSpreadMid(spread, mid),
      [RunActions.Offer]: (spread: number, offer: number) => bidSpreadOffer(spread, offer),
    },
    [RunActions.Mid]: {
      [RunActions.Spread]: (mid: number, spread: number) => bidSpreadMid(spread, mid),
      [RunActions.Offer]: (mid: number, offer: number) => bidOfferMid(offer, mid),
    },
    [RunActions.Offer]: {
      [RunActions.Spread]: (offer: number, spread: number) => bidSpreadOffer(spread, offer),
      [RunActions.Mid]: (offer: number, mid: number) => bidOfferMid(offer, mid),
    },
  },
};

