import { OrderTypes } from "types/mdEntry";
import { Order } from "types/order";

export const pickBestOrder = (self: Order, that: Order): Order => {
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
