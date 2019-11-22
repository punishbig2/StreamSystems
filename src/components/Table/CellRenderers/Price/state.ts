import {EntryStatus} from 'interfaces/order';

export interface State {
  tooltipX: number;
  tooltipY: number;
  flash: boolean;
  startedShowingTooltip: boolean;
  visible: boolean;
  status: EntryStatus;
  value: string;
}
