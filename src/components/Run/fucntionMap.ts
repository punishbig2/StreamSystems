import {RunActions} from 'components/Run/enumerator';

const spreadMidBid = (mid: number, bid: number): number => 2 * (mid - bid);
const spreadMidOffer = (mid: number, ofr: number): number => 2 * (ofr - mid);
const spreadBidOffer = (bid: number, ofr: number): number => ofr - bid;

const midSpreadBid = (spread: number, bid: number): number => (spread + 2 * bid) / 2;
const midSpreadOffer = (spread: number, ofr: number): number => (2 * ofr - spread) / 2;
const midBidOffer = (bid: number, ofr: number): number => (ofr + bid) / 2;

const offerSpreadMid = (spread: number, mid: number) => mid + spread / 2;
const offerSpreadBid = (spread: number, bid: number) => bid + spread;
const offerBidMid = (bid: number, mid: number) => 2 * mid - bid;

const bidSpreadMid = (spread: number, mid: number) => mid - spread / 2;
const bidSpreadOffer = (spread: number, ofr: number) => ofr - spread;
const bidOfferMid = (ofr: number, mid: number) => 2 * mid - ofr;

export const functionMap: { [k1: string]: { [k2: string]: { [k3: string]: (v1: number, v2: number) => number } } } = {
  [RunActions.Spread]: {
    [RunActions.Mid]: {
      [RunActions.Bid]: (mid: number, bid: number) => spreadMidBid(mid, bid),
      [RunActions.Ofr]: (mid: number, ofr: number) => spreadMidOffer(mid, ofr),
    },
    [RunActions.Bid]: {
      [RunActions.Mid]: (bid: number, mid: number) => spreadMidBid(mid, bid),
      [RunActions.Ofr]: (bid: number, ofr: number) => spreadBidOffer(bid, ofr),
    },
    [RunActions.Ofr]: {
      [RunActions.Mid]: (ofr: number, mid: number) => spreadMidOffer(mid, ofr),
      [RunActions.Bid]: (ofr: number, bid: number) => spreadBidOffer(bid, ofr),
    },
  },
  [RunActions.Mid]: {
    [RunActions.Spread]: {
      [RunActions.Bid]: (spread: number, bid: number) => midSpreadBid(spread, bid),
      [RunActions.Ofr]: (spread: number, ofr: number) => midSpreadOffer(spread, ofr),
    },
    [RunActions.Bid]: {
      [RunActions.Spread]: (bid: number, spread: number) => midSpreadBid(spread, bid),
      [RunActions.Ofr]: (bid: number, ofr: number) => midBidOffer(bid, ofr),
    },
    [RunActions.Ofr]: {
      [RunActions.Spread]: (ofr: number, spread: number) => midSpreadOffer(spread, ofr),
      [RunActions.Bid]: (ofr: number, bid: number) => midBidOffer(bid, ofr),
    },
  },
  [RunActions.Ofr]: {
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
      [RunActions.Ofr]: (spread: number, ofr: number) => bidSpreadOffer(spread, ofr),
    },
    [RunActions.Mid]: {
      [RunActions.Spread]: (mid: number, spread: number) => bidSpreadMid(spread, mid),
      [RunActions.Ofr]: (mid: number, ofr: number) => bidOfferMid(ofr, mid),
    },
    [RunActions.Ofr]: {
      [RunActions.Spread]: (ofr: number, spread: number) => bidSpreadOffer(spread, ofr),
      [RunActions.Mid]: (ofr: number, mid: number) => bidOfferMid(ofr, mid),
    },
  },
};

