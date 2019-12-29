import cptyColumn from 'columns/messageBlotterColumns/cptyColumn';
import priceColumn from 'columns/messageBlotterColumns/priceColumn';
import sideColumn from 'columns/messageBlotterColumns/sideColumn';
import sizeColumn from 'columns/messageBlotterColumns/sizeColumn';
import strategyColumn from 'columns/messageBlotterColumns/strategyColumn';
import symbolColumn from 'columns/messageBlotterColumns/symbolColumn';
import tenorColumn from 'columns/messageBlotterColumns/tenorColumn';
import transactTimeColumn from 'columns/messageBlotterColumns/transactTimeColumn';
import transactTypeColumn from 'columns/messageBlotterColumns/transactTypeColumn';
import {ColumnSpec} from 'components/Table/columnSpecification';

const columns: ColumnSpec[] = [
  transactTypeColumn,
  transactTimeColumn,
  sideColumn,
  sizeColumn,
  symbolColumn,
  tenorColumn,
  strategyColumn,
  priceColumn,
  cptyColumn,
];

export default columns;
