import {Button, Checkbox} from '@blueprintjs/core';
import runColumns from 'columns/run';
import {DialogButtons} from 'components/PullRight';
import {Item} from 'components/Run/item';
import {Layout} from 'components/Run/layout';
import {Table} from 'components/Table';
import {TitleBar} from 'components/TileTitleBar';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import strings from 'locales';
import React from 'react';

interface Props {
  toggleOCO: () => void;
  symbol: string;
  product: string;
  oco: boolean;
  rows: TOBTable;
  user: User;
  onClose: () => void;
}

const Run: React.FC<Props> = (props: Props) => {
  const onChange = () => {
    console.log('what?');
    props.toggleOCO();
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
      <Table<{}> columns={runColumns} rows={props.rows} handlers={{}} user={props.user}/>
      <DialogButtons>
        <Button text={strings.Close} intent={'primary'} onClick={props.onClose}/>
      </DialogButtons>
    </Layout>
  );
};

export {Run};
