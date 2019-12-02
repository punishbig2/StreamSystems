import {RunActions} from 'components/Run/enumerator';

const spreadMidBid = (mid: number | null, bid: number | null): number | null => mid === null || bid === null ? null : 2 * (mid - bid);
const spreadMidOffer = (mid: number | null, ofr: number | null): number | null => ofr === null || mid === null ? null : 2 * (ofr - mid);
const spreadBidOffer = (bid: number | null, ofr: number | null): number | null => ofr === null || bid === null ? null : ofr - bid;

const midSpreadBid = (spread: number | null, bid: number | null): number | null => bid === null || spread === null ? null : (spread + 2 * bid) / 2;
const midSpreadOffer = (spread: number | null, ofr: number | null): number | null => ofr === null || spread === null ? null : (2 * ofr - spread) / 2;
const midBidOffer = (bid: number | null, ofr: number | null): number | null => ofr === null || bid === null ? null : (ofr + bid) / 2;

const offerSpreadMid = (spread: number | null, mid: number | null): number | null => mid === null || spread === null ? null : mid + spread / 2;
const offerSpreadBid = (spread: number | null, bid: number | null): number | null => bid === null || spread === null ? null : bid + spread;
const offerBidMid = (bid: number | null, mid: number | null): number | null => mid === null || bid === null ? null : 2 * mid - bid;

const bidSpreadMid = (spread: number | null, mid: number | null): number | null => mid === null || spread === null ? null : mid - spread / 2;
const bidSpreadOffer = (spread: number | null, ofr: number | null): number | null => ofr === null || spread === null ? null : ofr - spread;
const bidOfferMid = (ofr: number | null, mid: number | null): number | null => mid === null || ofr === null ? null : 2 * mid - ofr;

export const functionMap: { [k1: string]: { [k2: string]: { [k3: string]: (v1: number | null, v2: number | null) => number | null } } } = {
  [RunActions.Spread]: {
    [RunActions.Mid]: {
      [RunActions.Bid]: (mid: number | null, bid: number | null) => spreadMidBid(mid, bid),
      [RunActions.Ofr]: (mid: number | null, ofr: number | null) => spreadMidOffer(mid, ofr),
    },
    [RunActions.Bid]: {
      [RunActions.Mid]: (bid: number | null, mid: number | null) => spreadMidBid(mid, bid),
      [RunActions.Ofr]: (bid: number | null, ofr: number | null) => spreadBidOffer(bid, ofr),
    },
    [RunActions.Ofr]: {
      [RunActions.Mid]: (ofr: number | null, mid: number | null) => spreadMidOffer(mid, ofr),
      [RunActions.Bid]: (ofr: number | null, bid: number | null) => spreadBidOffer(bid, ofr),
    },
  },
  [RunActions.Mid]: {
    [RunActions.Spread]: {
      [RunActions.Bid]: (spread: number | null, bid: number | null) => midSpreadBid(spread, bid),
      [RunActions.Ofr]: (spread: number | null, ofr: number | null) => midSpreadOffer(spread, ofr),
    },
    [RunActions.Bid]: {
      [RunActions.Spread]: (bid: number | null, spread: number | null) => midSpreadBid(spread, bid),
      [RunActions.Ofr]: (bid: number | null, ofr: number | null) => midBidOffer(bid, ofr),
    },
    [RunActions.Ofr]: {
      [RunActions.Spread]: (ofr: number | null, spread: number | null) => midSpreadOffer(spread, ofr),
      [RunActions.Bid]: (ofr: number | null, bid: number | null) => midBidOffer(bid, ofr),
    },
  },
  [RunActions.Ofr]: {
    [RunActions.Spread]: {
      [RunActions.Mid]: (spread: number | null, mid: number | null) => offerSpreadMid(spread, mid),
      [RunActions.Bid]: (spread: number | null, bid: number | null) => offerSpreadBid(spread, bid),
    },
    [RunActions.Bid]: {
      [RunActions.Mid]: (bid: number | null, mid: number | null) => offerBidMid(bid, mid),
      [RunActions.Spread]: (bid: number | null, spread: number | null) => offerSpreadBid(spread, bid),
    },
    [RunActions.Mid]: {
      [RunActions.Bid]: (mid: number | null, bid: number | null) => offerBidMid(bid, mid),
      [RunActions.Spread]: (mid: number | null, spread: number | null) => offerSpreadMid(spread, mid),
    },
  },
  [RunActions.Bid]: {
    [RunActions.Spread]: {
      [RunActions.Mid]: (spread: number | null, mid: number | null) => bidSpreadMid(spread, mid),
      [RunActions.Ofr]: (spread: number | null, ofr: number | null) => bidSpreadOffer(spread, ofr),
    },
    [RunActions.Mid]: {
      [RunActions.Spread]: (mid: number | null, spread: number | null) => bidSpreadMid(spread, mid),
      [RunActions.Ofr]: (mid: number | null, ofr: number | null) => bidOfferMid(ofr, mid),
    },
    [RunActions.Ofr]: {
      [RunActions.Spread]: (ofr: number | null, spread: number | null) => bidSpreadOffer(spread, ofr),
      [RunActions.Mid]: (ofr: number | null, mid: number | null) => bidOfferMid(ofr, mid),
    },
  },
};

