import timezones, {TimezoneInfo} from 'data/timezones';
import moment from 'moment';

export const wasModifiedToday = (timestamp: number | null, timezone: string) => {
  if (timestamp === null)
    return false;
  const tz: TimezoneInfo | undefined = timezones.find((tz: TimezoneInfo) => tz.text === timezone);
  if (tz) {
    const when: moment.Moment = moment
    // Get the time from unix timestamp in seconds (hence divide by 1000)
      .unix(Math.floor(timestamp / 1000))
      // Add the timezone offset
      .add(tz.offset, 'h')
    return when.isSame(new Date(), 'd');
  }
  return false;
};

