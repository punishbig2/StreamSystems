import {WindowElement} from 'components/WindowManager/window';
import {Window} from 'interfaces/window';
import React, {ReactElement, useState} from 'react';
import {WindowTypes} from 'redux/constants/workareaConstants';
import {MessageBlotter} from 'components/MessageBlotter';
import {BlotterTypes} from 'redux/constants/messageBlotterConstants';
import getStyles from 'styles';

interface Props {
  toast: string | null;
  renderContent: (id: string, type: WindowTypes) => ReactElement | null;
  windows: { [id: string]: Window };
  toolbarPinned: boolean;
  connected: boolean;
  personality: string;
  onGeometryChange: (id: string, geometry: ClientRect) => void;
  onWindowMinimized: (id: string) => void;
  onWindowClosed: (id: string) => void;
  onSetWindowTitle: (id: string, title: string) => void;
  onWindowRestored: (id: string) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onWindowClicked: (id: string) => void;
  onWindowSizeAdjusted: (id: string) => void;
  onClearToast: () => void;
}

const BodyRectangle: ClientRect = document.body.getBoundingClientRect();
const empty: any[] = [];
const WindowManager: React.FC<Props> = (props: Props): ReactElement | null => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const {renderContent} = props;
  // Get non-minimized windows
  const windows: [string, Window][] = Object
    .entries(props.windows || {});
  // Get minimized windows
  const minimized: [string, Window][] = windows
    .filter(([, window]: [string, Window]): boolean => window.minimized);
  const area: ClientRect = element ? new DOMRect(0, 0, element.offsetWidth, element.offsetHeight) : BodyRectangle;
  const windowMapper = ([id, window]: [string, Window]): ReactElement => {
    const {type} = window;
    const content: ReactElement | null = renderContent(id, type);
    const geometry: ClientRect | undefined = window.geometry;
    // Geometries of sibling windows
    const updateGeometry = (g: ClientRect) => props.onGeometryChange(id, g);
    const onMinimize = () => props.onWindowMinimized(id);
    const onClose = () => props.onWindowClosed(id);
    const onSetTitle = (title: string) => props.onSetWindowTitle(id, title);
    const onClick = () => props.onWindowClicked(id);
    const onWindowSizeAdjusted = () => props.onWindowSizeAdjusted(id);
    return (
      <WindowElement geometry={geometry}
                     key={id}
                     forbidden={empty}
                     area={area}
                     isMinimized={window.minimized}
                     autoSize={window.autoSize}
                     onGeometryChange={updateGeometry}
                     onClose={onClose}
                     onMinimize={onMinimize}
                     onSetTitle={onSetTitle}
                     onClick={onClick}
                     onAdjustSize={onWindowSizeAdjusted}>
        {content}
      </WindowElement>
    );
  };
  const minimizedWindowMapper = (([, window]: [string, Window]) => {
    const onRestore = (id: string) => props.onWindowRestored(id);
    return (
      <div className={'window-button'} onClick={() => onRestore(window.id)} key={window.id}>
        <h1>
          {window.title || window.id}
        </h1>
      </div>
    );
  });
  const classes = ['workspace'];
  if (props.toolbarPinned)
    classes.push('toolbar-pinned');
  const styles = getStyles();
  // Compute the ideal height
  const blotterHeight: number = styles.windowToolbarHeight + styles.tableHeaderHeight + 4 * styles.tableRowHeight;
  return (
    <div className={classes.join(' ')}
         onMouseLeave={props.onMouseLeave}
         onMouseMove={props.onMouseMove}
         ref={setElement}>
      {windows.map(windowMapper)}
      <WindowElement geometry={new DOMRect(0, area.height - blotterHeight, 0, blotterHeight)}
                     forbidden={empty}
                     area={area}
                     isMinimized={false}
                     autoSize={true}
                     onGeometryChange={() => null}
                     onClose={() => null}
                     onMinimize={() => null}
                     onSetTitle={() => null}
                     onClick={() => null}
                     onAdjustSize={() => null}>
        <MessageBlotter id={'fills-blotter'}
                        setWindowTitle={() => null}
                        connected={props.connected}
                        personality={props.personality}
                        blotterType={BlotterTypes.Fills}/>
      </WindowElement>
      <div className={'minimized-window-buttons'}>
        {minimized.map(minimizedWindowMapper)}
      </div>
      <div className={['toast', props.toast !== null ? 'visible' : 'hidden'].join(' ')}>
        <div className={'message'}>{props.toast}</div>
        <div className={'close-button'} onClick={props.onClearToast}>
          <i className={'fa fa-times'}/>
        </div>
      </div>
    </div>
  );
};

export {WindowManager};

