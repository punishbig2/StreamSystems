import { OrderStatus } from "interfaces/order";

export const getOrderStatusClass = (
  status: OrderStatus,
  className?: string
): string => {
  const classes: string[] = className !== undefined ? [className] : [];
  if ((status & OrderStatus.AtTop) !== 0) classes.push("at-top");
  if ((status & OrderStatus.Joined) !== 0) classes.push("joined");
  if ((status & OrderStatus.OwnedByBroker) !== 0)
    classes.push("owned-by-broker");
  if ((status & OrderStatus.FullDarkPool) !== 0) classes.push("dark-pool");
  if (status & OrderStatus.HasDepth) classes.push("has-depth");
  if (
    (status & OrderStatus.HasMyOrder) !== 0 &&
    (status & OrderStatus.Owned) === 0
  )
    classes.push("among");
  if ((status & OrderStatus.HasMyOrder) === 0) classes.push("not-among");
  if ((status & OrderStatus.Owned) !== 0) classes.push("owned");
  if ((status & OrderStatus.Active) !== 0) classes.push("active");
  if ((status & OrderStatus.PreFilled) !== 0) classes.push("pre-filled");
  if ((status & OrderStatus.Cancelled) !== 0) classes.push("cancelled");
  if ((status & OrderStatus.SameBank) !== 0) classes.push("same-bank");
  if (
    (status & OrderStatus.SizeEdited) !== 0 ||
    (status & OrderStatus.PriceEdited) !== 0
  )
    classes.push("edited");
  if ((status & OrderStatus.InDepth) !== 0) classes.push("in-depth");
  if ((status & OrderStatus.Publishing) !== 0) classes.push("busy");
  if ((status & OrderStatus.BeingCreated) !== 0) classes.push("busy");
  if ((status & OrderStatus.BeingCancelled) !== 0) classes.push("busy");
  if ((status & OrderStatus.BeingLoaded) !== 0) classes.push("busy");
  return classes.join(" ");
};
