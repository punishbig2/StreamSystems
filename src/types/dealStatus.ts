export enum DealStatus {
  Pending = 1,
  Priced = 2,
  SEFSubmitted = 3,
  SEFFailed = 4,
  SEFComplete = 5,
  STPSubmitted = 6,
  STPFailed = 7,
  STPComplete = 8,
}

export const toBitwise = (status: DealStatus): number => 1 << status;
