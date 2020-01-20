import {buyerColumn} from 'columns/messageBlotterColumns/buyerColumn';
import cptyColumn from 'columns/messageBlotterColumns/cptyColumn';
import {poolColumn} from 'columns/messageBlotterColumns/poolColumn';
import priceColumn from 'columns/messageBlotterColumns/priceColumn';
import {sellerColumn} from 'columns/messageBlotterColumns/sellerColumn';
import sideColumn from 'columns/messageBlotterColumns/sideColumn';
import sizeColumn from 'columns/messageBlotterColumns/sizeColumn';
import strategyColumn from 'columns/messageBlotterColumns/strategyColumn';
import symbolColumn from 'columns/messageBlotterColumns/symbolColumn';
import tenorColumn from 'columns/messageBlotterColumns/tenorColumn';
import transactTimeColumn from 'columns/messageBlotterColumns/transactTimeColumn';
import transactTypeColumn from 'columns/messageBlotterColumns/transactTypeColumn';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {BlotterTypes} from 'redux/constants/messageBlotterConstants';

const columns: (type: BlotterTypes) => { [key: string]: ColumnSpec[] } = (type: BlotterTypes) => {
  const filterAndSort: boolean = type !== BlotterTypes.Fills;
  return {
    normal: [
      ...(type === BlotterTypes.Fills ? [] : [transactTypeColumn(filterAndSort)]),
      transactTimeColumn(filterAndSort),
      sideColumn(filterAndSort),
      sizeColumn(filterAndSort),
      symbolColumn(filterAndSort),
      tenorColumn(filterAndSort),
      strategyColumn(filterAndSort),
      priceColumn(filterAndSort),
      cptyColumn(filterAndSort),
      poolColumn(filterAndSort),
    ],
    broker: [
      ...(type === BlotterTypes.Fills ? [] : [transactTypeColumn(filterAndSort)]),
      sizeColumn(filterAndSort),
      symbolColumn(filterAndSort),
      tenorColumn(filterAndSort),
      strategyColumn(filterAndSort),
      priceColumn(filterAndSort),
      buyerColumn(filterAndSort),
      sellerColumn(filterAndSort),
      poolColumn(filterAndSort),
    ],
  };
};

export default columns;
