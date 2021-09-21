import { OrderTypes } from "types/mdEntry";
import { Order } from "types/order";
import { pickBestOrder } from "utils/pickBestOrder";

type Book = { [tenor: string]: ReadonlyArray<Order> };

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
    return pickBestOrder(bestOffer, current);
  }, firstOffer);

  const bestBid = orders.reduce((bestBid: Order, current: Order): Order => {
    if (current.type !== bestBid.type) return bestBid;
    return pickBestOrder(bestBid, current);
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
