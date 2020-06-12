import React, { useCallback, ReactElement, useEffect, useState } from 'react';
import { Message } from 'interfaces/message';
import moment, { Moment } from 'moment';
import { Globals } from 'golbals';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { parseTime, INCOMING_DATE_FORMAT } from 'timeUtils';
import { CellProps } from 'components/MiddleOffice/DealBlotter/props';

const useTimer = (): Date => {
  const [date, setDate] = useState<Date>(new Date());
  const tick = useCallback(() => {
    setDate(new Date());
  }, []);
  useEffect(() => {
    const timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  });
  return date;
};

const CurrentTime: React.FC = (): ReactElement => {
  const date: Date = useTimer();
  return (
    <div>
      {date.toLocaleString('en-US', {
        timeZone: Globals.timezone || undefined,
      })}
    </div>
  );
};

export default (): ColumnSpec => ({
  name: 'TransactTime',
  template: 'MM/DD/YYYY 00:00:00 pm',
  header: () => 'Time',
  filterable: true,
  sortable: true,
  render: (props: CellProps): ReactElement | string => {
    const { deal } = props;
    if (deal) {
      const date: Date = parseTime(deal.transactionTime, Globals.timezone);
      return date.toLocaleString('en-US', {
        timeZone: Globals.timezone || undefined,
      });
    } else {
      return <CurrentTime/>;
    }
  },
  width: 6,
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
