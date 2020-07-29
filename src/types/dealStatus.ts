export enum DealStatus {
  Pending = 1,
  Priced = 2,
  SEFUnconfirmed = 3,
  STP = 4,
  SEFConfirmed = 5,
}

export const toBitwise = (status: DealStatus): number => 1 << status;
