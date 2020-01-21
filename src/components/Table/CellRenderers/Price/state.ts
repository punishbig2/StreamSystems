import {OrderStatus} from 'interfaces/order';

export interface State {
  tooltipX: number;
  tooltipY: number;
  flash: boolean;
  startedShowingTooltip: boolean;
  visible: boolean;
  initialStatus: OrderStatus;
  status: OrderStatus;
  internalValue: string;
}
