import {EntryStatus} from 'interfaces/tobEntry';

export interface State {
  tooltipX: number;
  tooltipY: number;
  flash: boolean;
  startedShowingTooltip: boolean;
  visible: boolean;
  status: EntryStatus;
  value: string;
}
