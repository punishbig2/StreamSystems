import moment from "moment";

export const printNow = (message: string): number =>
  setTimeout(() => {
    console.log(message, moment(new Date()).format("HH:MM:ss.SSS"));
  }, 0);
