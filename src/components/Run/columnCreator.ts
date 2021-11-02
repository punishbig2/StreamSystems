import { TabDirection } from "components/NumericInput";
import { NavigateDirection } from "components/NumericInput/navigateDirection";
import { onPriceChange } from "components/Run/helpers/onPriceChange";
import { RunActions } from "components/Run/reducer";
import { RunWindowStore } from "mobx/stores/runWindowStore";
import createColumns from "columns/run";
import { OrderTypes } from "types/mdEntry";
import { skipTabIndex, skipTabIndexAll } from "utils/skipTab";
import { $$ } from "utils/stringPaster";

export const createColumnsWithStore = (
  store: RunWindowStore,
  minimumSize: number,
  defaultSize: number,
  defaultBidSize: number,
  defaultOfrSize: number
) => {
  return createColumns({
    onBidChanged: onPriceChange(store, OrderTypes.Bid),
    onOfrChanged: onPriceChange(store, OrderTypes.Ofr),
    onMidChanged: (id: string, value: number | null) => store.setMid(id, value),
    onSpreadChanged: (id: string, value: number | null): void =>
      store.setSpread(id, value),
    onBidQtyChanged: (id: string, value: number | null): void =>
      store.setBidSize(id, value),
    onOfrQtyChanged: (id: string, value: number | null): void =>
      store.setOfrSize(id, value),
    onActivateOrder: (id: string, type: OrderTypes): void =>
      store.activateOrder(id, type),
    onDeactivateOrder: (id: string, type: OrderTypes): void =>
      store.deactivateOrder(id, type),
    defaultBidSize: {
      minimum: minimumSize,
      value: defaultBidSize,
      onSubmit: (input: HTMLInputElement, value: number | null): void => {
        store.setDefaultBidSize(value);
        skipTabIndexAll(input, 3, 0, 9);
      },
      onReset: (): void => store.setDefaultBidSize(defaultSize),
      type: OrderTypes.Bid,
    },
    defaultOfrSize: {
      minimum: minimumSize,
      value: defaultOfrSize,
      onSubmit: (input: HTMLInputElement, value: number | null): void => {
        store.setDefaultOfrSize(value);
        skipTabIndexAll(input, 2, 0, 9);
      },
      onReset: (): void => store.setDefaultOfrSize(defaultSize),
      type: OrderTypes.Ofr,
    },
    defaultSize: defaultSize,
    minimumSize: minimumSize,
    onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => {
      switch (direction) {
        case NavigateDirection.Up:
          skipTabIndexAll(target, -6, "last-row");
          break;
        case NavigateDirection.Left:
          skipTabIndexAll(target, -1);
          break;
        case NavigateDirection.Down:
          skipTabIndexAll(target, 6, "first-row");
          break;
        case NavigateDirection.Right:
          skipTabIndexAll(target, 1);
          break;
      }
    },
    focusNext: (
      target: HTMLInputElement,
      tabDirection: TabDirection,
      action?: string
    ) => {
      switch (action) {
        case RunActions.Bid:
          skipTabIndex(target, 1 * tabDirection, 0);
          break;
        case RunActions.Spread:
          skipTabIndex(target, 4 * tabDirection, 3);
          break;
        case RunActions.Ofr:
          skipTabIndex(target, 3 * tabDirection, 0);
          break;
        case RunActions.Mid:
          skipTabIndex(target, 4 * tabDirection, 2);
          break;
        case $$("1", "size"):
          skipTabIndexAll(target, 4 * tabDirection, 2);
          break;
        default:
          skipTabIndexAll(target, 1 * tabDirection, 0);
          break;
      }
    },
  });
};
