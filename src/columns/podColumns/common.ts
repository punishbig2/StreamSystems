import { PodTable } from 'interfaces/podTable';
import { PodRow, PodRowStatus } from 'interfaces/podRow';
import { User } from 'interfaces/user';

export type PodRowProps = PodRow & {
  depths: { [key: string]: PodTable };
  personality: string;
  defaultSize: number;
  minimumSize: number;
  darkPrice: number | null;
  symbol: string;
  strategy: string;
  status: PodRowStatus;
  connected: boolean;
  user: User;
  // Event handlers
  onTenorSelected: (tenor: string) => void;
  onRowStatusChange: (status: PodRowStatus) => void;
};

