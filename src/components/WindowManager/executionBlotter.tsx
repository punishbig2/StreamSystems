import React, { ReactElement, useRef } from 'react';
import { WindowElement } from 'components/WindowManager/window';
import { MessageBlotter } from 'components/MessageBlotter';
import { BlotterTypes } from 'redux/constants/messageBlotterConstants';
import getStyles, { Dimensions } from 'styles';
import { User } from 'interfaces/user';
import { getOptimalSize } from 'windowUtils';
import { WindowTypes } from 'redux/constants/workareaConstants';

interface OwnProps {
  area: ClientRect;
  connected: boolean;
  user: User;
  personality: string;
}

export const ExecutionBlotter: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const ref: React.Ref<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const { area } = props;
  const { width } = ref.current ? getOptimalSize(ref.current, area) : { width: 0 };
  // Compute the ideal height
  const styles: Dimensions = getStyles();
  const height: number = styles.windowToolbarHeight + styles.tableHeaderHeight + 4 * styles.tableRowHeight;
  const geometry: ClientRect = new DOMRect(0, area.height - height, width, height);
  const id: string = '___EX_BLOTTER___';
  return (
    <WindowElement id={id}
                   geometry={geometry}
                   type={WindowTypes.MessageBlotter}
                   area={area}
                   fixed={true}
                   isDefaultWorkspace={false}
                   onClose={() => null}
                   onLayoutModify={() => null}>
      <MessageBlotter
        id={'fills-blotter'}
        ref={ref}
        connected={props.connected}
        personality={props.personality}
        blotterType={BlotterTypes.Executions}
        user={props.user}/>
    </WindowElement>
  );
};
