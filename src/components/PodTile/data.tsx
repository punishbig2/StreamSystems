import {PriceErrors} from 'components/Table/CellRenderers/Price';
import {AggregatedSz} from 'components/PodTile/reducer';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {PodTable} from 'interfaces/podTable';

export interface TOBColumnData {
  onTenorSelected: (tenor: string) => void;
  onDoubleClick: (type: OrderTypes, data: any) => void;
  onRefBidsButtonClicked: () => void;
  onRefOfrsButtonClicked: () => void;
  onOrderModified: (entry: Order) => void;
  onQuantityChange: (entry: Order, newQuantity: number | null, personality: string, minimumSize: number, input: HTMLInputElement) => void;
  onCancelOrder: (entry: Order, cancelRelated: boolean) => void;
  onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => void;
  onOrderError: (
    order: Order,
    error: PriceErrors,
    input: HTMLInputElement,
  ) => void;
  aggregatedSize?: AggregatedSz;
  buttonsEnabled: boolean;
  isBroker: boolean;
  onDarkPoolPriceChanged: (tenor: string, price: number) => void;
  onDarkPoolDoubleClicked: (
    tenor: string,
    price: number | null,
    currentOrder: Order | null,
  ) => void;
  onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => void;
  onCancelDarkPoolOrder: (order: Order) => void;
  personality: string;
  symbol: string;
  strategy: string;
  defaultSize: number;
  minimumSize: number;
  depths: { [key: string]: PodTable };
}
