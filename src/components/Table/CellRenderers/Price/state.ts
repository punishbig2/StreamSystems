import {EntryStatus} from 'interfaces/tobEntry';

export interface State {
  tooltipX: number;
  tooltipY: number;
  startedShowingTooltip: boolean;
  visible: boolean;
  status: EntryStatus;
  value: string | null;
}
