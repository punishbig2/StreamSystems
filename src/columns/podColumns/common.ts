import {PodTable} from 'interfaces/podTable';
import {PodRow, PodRowStatus} from 'interfaces/podRow';

export type PodRowProps = PodRow & {
  depths: { [key: string]: PodTable };
  personality: string;
  isBroker: boolean;
  defaultSize: number;
  minimumSize: number;
  darkPrice: number | null;
  symbol: string;
  strategy: string;
  status: PodRowStatus;
  connected: boolean;
  // Event handlers
  onTenorSelected: (tenor: string) => void;
  onRowStatusChange: (status: PodRowStatus) => void;
};

