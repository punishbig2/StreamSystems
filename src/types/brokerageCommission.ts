export interface BrokerageCommission {
  readonly buyer_comm_rate: number | null;
  readonly seller_comm_rate: number | null;
  readonly buyer_comm: number | null;
  readonly seller_comm: number | null;
  readonly total: number | null;
}
