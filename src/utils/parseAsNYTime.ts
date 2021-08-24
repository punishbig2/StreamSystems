import moment, { Moment } from "moment-timezone";

export const parseAsNYTime = (value: string): Moment => {
  const timezone = "America/New_York";
  return moment.tz(value, "HH:mm:ss", timezone).local();
};
