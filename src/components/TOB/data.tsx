import { PriceErrors } from "components/Table/CellRenderers/Price";
import { AggregatedSz } from "components/TOB/reducer";
import { OrderTypes } from "interfaces/mdEntry";
import { Order } from "interfaces/order";

export interface TOBColumnData {
  onTenorSelected: (tenor: string) => void;
  onDoubleClick: (type: OrderTypes, data: any) => void;
  onRefBidsButtonClicked: () => void;
  onRefOfrsButtonClicked: () => void;
  onOrderModified: (entry: Order) => void;
  onQuantityChange: (
    entry: Order,
    newQuantity: number | null,
    input: HTMLInputElement
  ) => void;
  onCancelOrder: (entry: Order, cancelRelated: boolean) => void;
  onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => void;
  onOrderError: (
    order: Order,
    error: PriceErrors,
    input: HTMLInputElement
  ) => void;
  aggregatedSz?: AggregatedSz;
  buttonsEnabled: boolean;
  isBroker: boolean;
  onDarkPoolPriceChanged: (tenor: string, price: number) => void;
  onDarkPoolDoubleClicked: (
    tenor: string,
    price: number | null,
    currentOrder: Order | null
  ) => void;
  onCancelDarkPoolOrder: (order: Order) => void;
  personality: string;
  symbol: string;
  strategy: string;
}
