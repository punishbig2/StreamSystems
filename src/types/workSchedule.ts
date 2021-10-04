export interface WorkSchedule {
  readonly end_of_day_time: string;
  readonly trading_start_time: string;
  readonly trading_end_time: string;
  readonly startDay: number;
  readonly endDay: number;
}

export const invalidWorkSchedule: WorkSchedule = {
  end_of_day_time: "00:00:00",
  trading_start_time: "00:00:00",
  trading_end_time: "00:00:00",
  startDay: 0,
  endDay: 7,
};
