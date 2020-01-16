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

const columns: { [key: string]: ColumnSpec[] } = {
  normal: [
    transactTypeColumn,
    transactTimeColumn,
    sideColumn,
    sizeColumn,
    symbolColumn,
    tenorColumn,
    strategyColumn,
    priceColumn,
    cptyColumn,
    poolColumn,
  ],
  broker: [
    transactTypeColumn,
    sizeColumn,
    symbolColumn,
    tenorColumn,
    strategyColumn,
    priceColumn,
    buyerColumn,
    sellerColumn,
    poolColumn,
  ],
};

export default columns;
