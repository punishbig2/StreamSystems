import {Changes} from 'components/Run/enumerator';

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
  [Changes.Spread]: {
    [Changes.Mid]: {
      [Changes.Bid]: (mid: number, bid: number) => spreadMidBid(mid, bid),
      [Changes.Offer]: (mid: number, offer: number) => spreadMidOffer(mid, offer),
    },
    [Changes.Bid]: {
      [Changes.Mid]: (bid: number, mid: number) => spreadMidBid(mid, bid),
      [Changes.Offer]: (bid: number, offer: number) => spreadBidOffer(bid, offer),
    },
    [Changes.Offer]: {
      [Changes.Mid]: (offer: number, mid: number) => spreadMidOffer(mid, offer),
      [Changes.Bid]: (offer: number, bid: number) => spreadBidOffer(bid, offer),
    },
  },
  [Changes.Mid]: {
    [Changes.Spread]: {
      [Changes.Bid]: (spread: number, bid: number) => midSpreadBid(spread, bid),
      [Changes.Offer]: (spread: number, offer: number) => midSpreadOffer(spread, offer),
    },
    [Changes.Bid]: {
      [Changes.Spread]: (bid: number, spread: number) => midSpreadBid(spread, bid),
      [Changes.Offer]: (bid: number, offer: number) => midBidOffer(bid, offer),
    },
    [Changes.Offer]: {
      [Changes.Spread]: (offer: number, spread: number) => midSpreadOffer(spread, offer),
      [Changes.Bid]: (offer: number, bid: number) => midBidOffer(bid, offer),
    },
  },
  [Changes.Offer]: {
    [Changes.Spread]: {
      [Changes.Mid]: (spread: number, mid: number) => offerSpreadMid(spread, mid),
      [Changes.Bid]: (spread: number, bid: number) => offerSpreadBid(spread, bid),
    },
    [Changes.Bid]: {
      [Changes.Mid]: (bid: number, mid: number) => offerBidMid(bid, mid),
      [Changes.Spread]: (bid: number, spread: number) => offerSpreadBid(spread, bid),
    },
    [Changes.Mid]: {
      [Changes.Bid]: (mid: number, bid: number) => offerBidMid(bid, mid),
      [Changes.Spread]: (mid: number, spread: number) => offerSpreadMid(spread, mid),
    },
  },
  [Changes.Bid]: {
    [Changes.Spread]: {
      [Changes.Mid]: (spread: number, mid: number) => bidSpreadMid(spread, mid),
      [Changes.Offer]: (spread: number, offer: number) => bidSpreadOffer(spread, offer),
    },
    [Changes.Mid]: {
      [Changes.Spread]: (mid: number, spread: number) => bidSpreadMid(spread, mid),
      [Changes.Offer]: (mid: number, offer: number) => bidOfferMid(offer, mid),
    },
    [Changes.Offer]: {
      [Changes.Spread]: (offer: number, spread: number) => bidSpreadOffer(spread, offer),
      [Changes.Mid]: (offer: number, mid: number) => bidOfferMid(offer, mid),
    },
  },
};
