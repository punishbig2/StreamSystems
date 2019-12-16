import {WindowElement} from 'components/WindowManager/window';
import {Window} from 'interfaces/window';
import React, {ReactElement, useState} from 'react';
import {WindowTypes} from 'redux/constants/workareaConstants';

interface Props {
  toast: string | null;
  renderContent: (id: string, type: WindowTypes) => ReactElement | null;
  windows: { [id: string]: Window };
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
  const windowMapper = ([id, window]: [string, Window]): ReactElement => {
    const {type} = window;
    const content: ReactElement | null = renderContent(id, type);
    const geometry: ClientRect | undefined = window.geometry;
    // Geometries of sibling windows
    const updateGeometry = (g: ClientRect) => props.onGeometryChange(id, g);
    const area: ClientRect = element ? new DOMRect(0, 0, element.offsetWidth, element.offsetHeight) : BodyRectangle;
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
  return (
    <div className={'workspace'} onMouseLeave={props.onMouseLeave} onMouseMove={props.onMouseMove} ref={setElement}>
      {windows.map(windowMapper)}
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

