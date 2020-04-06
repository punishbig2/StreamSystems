import { buyerColumn } from 'columns/messageBlotterColumns/buyerColumn';
import cptyColumn from 'columns/messageBlotterColumns/cptyColumn';
import { poolColumn } from 'columns/messageBlotterColumns/poolColumn';
import priceColumn from 'columns/messageBlotterColumns/priceColumn';
import { sellerColumn } from 'columns/messageBlotterColumns/sellerColumn';
import sideColumn from 'columns/messageBlotterColumns/sideColumn';
import sizeColumn from 'columns/messageBlotterColumns/sizeColumn';
import strategyColumn from 'columns/messageBlotterColumns/strategyColumn';
import symbolColumn from 'columns/messageBlotterColumns/symbolColumn';
import tenorColumn from 'columns/messageBlotterColumns/tenorColumn';
import transactTimeColumn from 'columns/messageBlotterColumns/transactTimeColumn';
import transactTypeColumn from 'columns/messageBlotterColumns/transactTypeColumn';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { BlotterTypes } from 'redux/constants/messageBlotterConstants';

const columns: (type: BlotterTypes) => { [key: string]: ColumnSpec[] } = (type: BlotterTypes) => {
  const sortable: boolean = type !== BlotterTypes.Executions;
  return {
    normal: [...(type === BlotterTypes.Executions ? [] : [transactTypeColumn(sortable)]),
      transactTimeColumn(),
      symbolColumn(sortable),
      tenorColumn(sortable),
      strategyColumn(sortable),
      priceColumn(sortable),
      sideColumn(sortable),
      sizeColumn(sortable),
      cptyColumn(sortable, type === BlotterTypes.Executions),
      poolColumn(sortable),
    ],
    broker: [...(type === BlotterTypes.Executions ? [] : [transactTypeColumn(sortable)]),
      sizeColumn(sortable),
      symbolColumn(sortable),
      tenorColumn(sortable),
      strategyColumn(sortable),
      priceColumn(sortable),
      buyerColumn(sortable),
      sellerColumn(sortable),
      poolColumn(sortable),
    ],
  };
};

export default columns;
