import {DefaultWindowButtons} from 'components/DefaultWindowButtons';
import {Table} from 'components/Table';
import {TitleBar, WindowTitle} from 'components/TileTitleBar';
import React, {ReactElement} from 'react';
import {MosaicBranch, MosaicWindow} from 'react-mosaic-component';
import columns from 'columns/messageBlotter';
import strings from 'locales';

interface Props {
  path: MosaicBranch[],
  onClose: () => void;
}

const MessageBlotter: React.FC<Props> = (props: Props) => {
  const toolbar: ReactElement = (
    <TitleBar>
      <WindowTitle>{strings.Messages}</WindowTitle>
      <DefaultWindowButtons onClose={props.onClose}/>
    </TitleBar>
  );
  return (
    <MosaicWindow<string> title={''} path={props.path} toolbarControls={toolbar}>
      <Table columns={columns} rows={[]}/>
    </MosaicWindow>
  );
};

export {MessageBlotter};
