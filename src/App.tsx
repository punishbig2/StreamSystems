import 'App.css';

import Table from 'components/Table';
import {ColumnSpec} from 'components/Table/columnSpecification';
import Grid from 'components/Tiles/Grid';
import Tile from 'components/Tiles/Tile';

import 'fonts/fontawesome/css/all.min.css';

import React, {ReactNode} from 'react';

const columns: ColumnSpec[] = [];
const rows: any[] = [];

const App: React.FC = () => {
  const array: ReactNode[] = new Array<ReactNode>(30);
  // Javascript is still stupid, isn't it?
  array.fill(1);
  const content = (): ReactNode => <Table columns={columns} rows={rows}/>;
  return (
    <Grid>
      {array.map((one, index) => <Tile key={index} title={`Tile ${index}`} render={content}/>)}
    </Grid>
  );
};

export default App;
