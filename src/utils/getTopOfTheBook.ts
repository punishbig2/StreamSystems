import { OrderTypes } from "types/mdEntry";
import { Order } from "types/order";

type Book = { [tenor: string]: ReadonlyArray<Order> };

const pickBest = (self: Order, that: Order): Order => {
  if (self.type !== that.type) {
    throw new Error("attempted to compare orders with different sides");
  }

  if (self.price === null) return that;
  if (that.price === null) return self;

  switch (self.type) {
    case OrderTypes.Ofr:
      return that.price < self.price ? that : self;
    case OrderTypes.Bid:
      return that.price > self.price ? that : self;
    case OrderTypes.Invalid:
    case OrderTypes.DarkPool:
      throw new Error("cannot determine which is best");
  }
};

const getBestOrders = (
  orders: ReadonlyArray<Order>
): Readonly<[Order, Order]> => {
  const firstOffer = orders.find(
    (order: Order): boolean => order.type === OrderTypes.Ofr
  );
  const firstBid = orders.find(
    (order: Order): boolean => order.type === OrderTypes.Bid
  );
  if (!firstBid || !firstOffer)
    throw new Error("there must be at least 1 bid and 1 offer");

  const bestOffer = orders.reduce((bestOffer: Order, current: Order): Order => {
    if (current.type !== bestOffer.type) return bestOffer;
    return pickBest(bestOffer, current);
  }, firstOffer);

  const bestBid = orders.reduce((bestBid: Order, current: Order): Order => {
    if (current.type !== bestBid.type) return bestBid;
    return pickBest(bestBid, current);
  }, firstBid);

  return [bestBid, bestOffer];
};

export const getTopOfTheBook = (orders: Book): Book => {
  const tenors = Object.keys(orders);
  return tenors.reduce((book: Book, tenor: string): Book => {
    if (book[tenor] === undefined) return book;
    return { ...book, [tenor]: getBestOrders(book[tenor]) };
  }, orders);
};
