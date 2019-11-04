import {Button, Checkbox} from '@blueprintjs/core';
import runColumns from 'columns/run';
import {DialogButtons} from 'components/PullRight';
import {RunHandlers} from 'components/Run/handlers';
import {Item} from 'components/Run/item';
import {Layout} from 'components/Run/layout';
import {Table} from 'components/Table';
import {TitleBar} from 'components/TileTitleBar';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {useCallback, useState} from 'react';

interface Props {
  toggleOCO: () => void;
  symbol: string;
  product: string;
  oco: boolean;
  rows: TOBTable;
  user: User;
  onClose: () => void;
  onSubmit: () => void;
}

const Run: React.FC<Props> = (props: Props) => {
  const [rows, setRows] = useState<TOBTable>(props.rows);
  const onChange = () => {
    props.toggleOCO();
  };
  const findRow = (tenor: string): TOBRow | null => {
    const key: string | undefined = Object.keys(rows)
      .find((key) => key.startsWith(tenor))
    ;
    if (key === undefined)
      return null;
    return {...rows[key]};
  };
  type Type = 'offer' | 'bid' | 'mid' | 'spread';
  const updateRow = (row: TOBRow | null, which: Type) => {
    if (row === null)
      return;
    const {bid, offer} = row;
    switch (which) {
      case 'offer':
        if (offer.price === null)
          return;
        if (bid.price !== null) {
          row.mid = (bid.price + bid.price) / 2;
          row.spread = offer.price - bid.price;
        } else if (row.mid !== null) {
          bid.price = 2 * row.mid - offer.price;
          row.spread = offer.price - bid.price;
        } else if (row.spread !== null) {
          bid.price = offer.price + row.spread;
          row.mid = (offer.price + bid.price) / 2;
        }
        break;
      case 'bid':
        if (bid.price === null)
          return;
        if (offer.price !== null) {
          row.mid = (offer.price + bid.price) / 2;
          row.spread = offer.price - bid.price;
        } else if (row.mid !== null) {
          offer.price = 2 * row.mid - bid.price;
          row.spread = offer.price - bid.price;
        } else if (row.spread !== null) {
          offer.price = bid.price + row.spread;
          row.mid = (offer.price + bid.price) / 2;
        }
        break;
      case 'mid':
        if (row.mid === null)
          return;
        if (row.spread !== null) {
          bid.price = row.mid - row.spread / 2;
          offer.price = row.mid + row.spread / 2;
        } else if (bid.price !== null) {
          offer.price = 2 * row.mid - bid.price;
          row.spread = offer.price - bid.price;
        } else if (offer.price !== null) {
          bid.price = 2 * row.mid - offer.price;
          row.spread = offer.price - bid.price;
        }
        break;
      case 'spread':
        if (row.spread === null)
          return;
        if (row.mid !== null) {
          bid.price = row.mid - row.spread / 2;
          offer.price = row.mid + row.spread / 2;
        } else if (bid.price !== null) {
          offer.price = bid.price + row.spread;
          row.mid = (offer.price + bid.price);
        } else if (offer.price !== null) {
          bid.price = offer.price - row.spread;
          row.mid = (offer.price + bid.price);
        }
        break;
    }
    console.log(row, offer, bid);
    setRows({...rows, [row.id]: {...row, offer, bid}});
  };
  const handlers: RunHandlers = {
    onBidChanged: (tenor: string, value: number) => {
      const row: TOBRow | null = findRow(tenor);
      if (row === null)
        return;
      updateRow({...row, bid: {...row.bid, price: value}}, 'bid');
    },
    onOfferChanged: (tenor: string, value: number) => {
      const row: TOBRow | null = findRow(tenor);
      if (row === null)
        return;
      updateRow({...row, offer: {...row.offer, price: value}}, 'offer');
    },
    onMidChanged: (tenor: string, mid: number) => {
      const row: TOBRow | null = findRow(tenor);
      if (row === null)
        return;
      updateRow({...row, mid}, 'mid');
    },
    onSpreadChanged: (tenor: string, spread: number) => {
      const row: TOBRow | null = findRow(tenor);
      if (row === null)
        return;
      updateRow({...row, spread}, 'spread');
    },
  };
  return (
    <Layout>
      <TitleBar>
        <Item>{props.symbol}</Item>
        <Item>{props.product}</Item>
        <Item>
          <Checkbox checked={props.oco} onChange={onChange} label={'OCO'} inline/>
        </Item>
      </TitleBar>
      <Table<RunHandlers> columns={runColumns} rows={rows} handlers={handlers} user={props.user}/>
      <DialogButtons>
        <Button text={strings.Submit} intent={'primary'} onClick={props.onSubmit}/>
        <Button text={strings.Close} intent={'none'} onClick={props.onClose}/>
      </DialogButtons>
    </Layout>
  );
};

export {Run};
