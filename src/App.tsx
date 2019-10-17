import 'App.css';

import {Table} from 'components/Table';
import {Grid} from 'components/Tiles/Grid';
import {ignoreAndRun} from 'components/Tiles/Grid/helpers';
import {Tile} from 'components/Tiles/Tile';

import 'fonts/fontawesome/css/all.min.css';
import {MDEntry, Types} from 'models/mdEntry';
import {User} from 'models/user';

import React, {ReactElement, ReactNode, useState} from 'react';
import columns from 'definitions/TOB';
import {fake, Message} from 'models/md';
import styled, {ThemeProvider} from 'styled-components';
import {theme} from 'theme';

const StyledSelect = styled.select`
  background: none;
  border: none;
  padding: 2px 8px;
  margin: 0 8px 0 0;
  &:hover, &:focus {
    background-color: rgba(0, 0, 0, 0.15);
  }
`;

const rows = fake();
const tableRows = rows.map((row) => ({...row, id: row.Tenor}));

type R = { [index: string]: { bid: any, ask: any } };
const extractDOB = (tenor: string) => (data: Message[]) => {
  const object = data
    .filter((message: Message) => message.Tenor === tenor)
    .map((message: Message) => {
      const {MDEntries} = message;
      return MDEntries.reduce((reduced: R, entry: MDEntry): R => {
        if (reduced[entry.MDFirm] === undefined) {
          reduced[entry.MDFirm] = {bid: {}, ask: {}};
        }
        const row = reduced[entry.MDFirm];
        if (entry.MDEntryType === Types.Bid) {
          reduced[entry.MDFirm] = {
            ...row,
            bid: {price: entry.MDEntryPx, size: entry.MDEntrySize, user: entry.MDUserId},
          };
        } else {
          reduced[entry.MDFirm] = {
            ...row,
            ask: {price: entry.MDEntryPx, size: entry.MDEntrySize, user: entry.MDUserId},
          };
        }
        return reduced;
      }, {} as R);
    });
  return Object
    .entries(object[0])
    .map(([firm, row]) => {
      return {
        tenor: tenor,
        id: firm,
        ...row,
      };
    });
};

const extractTOB = (data: Message[]) => {
  if (!data)
    return [];
  return data
    .map((message: Message) => {
      const {MDEntries} = message;
      const allBids: MDEntry[] = MDEntries.filter((entry) => entry.MDEntryType === Types.Bid);
      // Sort them
      allBids.sort((a: MDEntry, b: MDEntry) => b.MDEntryPx - a.MDEntryPx);
      const bestBid: MDEntry = allBids[0];
      const allAsks: MDEntry[] = MDEntries.filter((entry) => entry.MDEntryType === Types.Ask);
      // Sort them
      allAsks.sort((a: MDEntry, b: MDEntry) => a.MDEntryPx - b.MDEntryPx);
      const bestAsk: MDEntry = allAsks[0];
      return {
        id: message.Tenor,
        tenor: message.Tenor,
        bid: {
          size: bestBid.MDEntrySize,
          price: bestBid.MDEntryPx,
          user: bestBid.MDUserId,
          dob: allBids.map((entry: MDEntry) => ({price: entry.MDEntryPx, size: entry.MDEntrySize})),
        },
        ask: {
          size: bestAsk.MDEntrySize,
          price: bestAsk.MDEntryPx,
          user: bestAsk.MDUserId,
          dob: allAsks.map((entry: MDEntry) => ({price: entry.MDEntryPx, size: entry.MDEntrySize})),
        },
      };
    });
};

const array: string[] = new Array<string>(8)
  .fill('')
  .map<string>((constant: string, index: number) => `tile-${index}`);
const App: React.FC = () => {
  const TileContent = (): ReactNode => {
    const [tenor, setTenor] = useState<string | null>(null);
    const onTenorSelected = (newTenor: string) => {
      if (tenor !== null) {
        setTenor(null);
      } else {
        setTenor(newTenor);
      }
    };
    const currentUser: User = {id: '1'};
    const rows = tenor === null ? extractTOB(tableRows) : extractDOB(tenor)(tableRows);
    // Return the table with the selected content
    return <Table columns={columns} rows={rows} handlers={{onTenorSelected}} user={currentUser}/>;
  };
  const title: React.FC = () => {
    return (
      <div>
        <StyledSelect onMouseDownCapture={ignoreAndRun(() => null)}>
          <option value={'USD/MXN'}>USD/MXN</option>
          <option value={'USD/VES'}>USD/VES</option>
        </StyledSelect>
        <StyledSelect onMouseDownCapture={ignoreAndRun(() => null)}>
          <option value={'ATM'}>ATM</option>
        </StyledSelect>
      </div>
    );
  };
  return (
    <ThemeProvider theme={theme}>
      <Grid>
        {array.map<ReactElement>((id: string) => <Tile key={id} id={id} title={title} render={TileContent}/>)}
      </Grid>
    </ThemeProvider>
  );
};

export default App;
