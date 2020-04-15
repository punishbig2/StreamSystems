import React, { ReactElement } from 'react';
import { WindowElement } from 'components/WindowManager/windowElement';
import { MessageBlotter } from 'components/MessageBlotter';
import { BlotterTypes } from 'redux/constants/messageBlotterConstants';
import getStyles, { Dimensions } from 'styles';
import { User } from 'interfaces/user';
import { WindowTypes } from 'redux/constants/workareaConstants';
import { getOptimalWidthFromColumnsSpec } from 'getOptimalWIdthFromColumnsSpec';
import columns from 'columns/messageBlotter';
import workareaStore from 'mobx/stores/workareaStore';

interface OwnProps {
  area: ClientRect;
  connected: boolean;
  user: User;
  personality: string;
}

export const ExecutionBlotter: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const { area } = props;
  const user: User | null = workareaStore.user;
  if (user === null)
    throw new Error('cannot have a execution blotter without an authenticated user');
  const type: 'normal' | 'broker' = user.isbroker ? 'broker' : 'normal';
  const width: number = getOptimalWidthFromColumnsSpec(columns(BlotterTypes.Executions)[type]);
  // Compute the ideal height
  const styles: Dimensions = getStyles();
  const height: number = styles.windowToolbarHeight + styles.tableHeaderHeight + 4 * styles.tableRowHeight;
  const geometry: ClientRect = new DOMRect(0, area.height - height, width, height);
  const id: string = '___EX_BLOTTER___';
  const content = (): ReactElement => {
    return (
      <MessageBlotter id={id}
                      personality={props.personality}
                      connected={props.connected}
                      user={props.user}
                      blotterType={BlotterTypes.Executions}/>
    );
  };
  const title = () => <h1>Execution Blotter</h1>;
  return (
    <WindowElement id={id}
                   geometry={geometry}
                   type={WindowTypes.MessageBlotter}
                   area={area}
                   fitToContent={false}
                   fixed={true}
                   content={content}
                   title={title}
                   isDefaultWorkspace={false}
                   connected={props.connected}
                   personality={props.personality}
                   user={props.user}
                   onClose={() => null}
                   onLayoutModify={() => null}/>
  );
};
