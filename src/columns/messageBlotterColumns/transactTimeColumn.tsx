import {Message} from 'interfaces/message';
import moment, {Moment} from 'moment';
import React from 'react';
import {Globals} from 'golbals';

const INCOMING_DATE_FORMAT: string = 'YYYYMMDD-hh:mm:ss';

const parse = (date: string, tz: string | null): Date => {
  const regex: RegExp = /(\d{4})(\d{2})(\d{2})-(\d{2}):(\d{2}):(\d{2})/;
  const match: RegExpExecArray | null = regex.exec(date);
  if (match === null)
    return new Date();
  return new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6]),
    ),
  );
};

export default () => ({
  name: 'TransactTime',
  template: 'MM/DD/YYYY 00:00:00 pm',
  header: () => <div>Time</div>,
  filterable: true,
  sortable: true,
  render: (data: Message) => {
    const date: Date = parse(data.TransactTime, Globals.timezone);
    const formattedDate: string = date.toLocaleString('en-US', {
      timeZone: Globals.timezone || undefined,
    });
    return (
      <div className={'message-blotter-cell time'}>
        {formattedDate}
      </div>
    );
  },
  weight: 4,
  difference: (v1: Message, v2: Message): number => {
    const m1: Moment = moment(v1.TransactTime, INCOMING_DATE_FORMAT);
    const m2: Moment = moment(v2.TransactTime, INCOMING_DATE_FORMAT);
    return m1.diff(m2);
  },
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.TransactTime;
    if (!original) return false;
    const value: string = origin.toLowerCase();
    return value.includes(keyword);
  },
});
