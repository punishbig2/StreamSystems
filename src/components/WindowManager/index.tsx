import {WindowElement} from 'components/WindowManager/window';
import {Window} from 'interfaces/window';
import React, {ReactElement, useState} from 'react';
import {WindowTypes} from 'redux/constants/workareaConstants';

interface Props {
  windows: { [id: string]: Window };
  onGeometryChange: (id: string, geometry: ClientRect) => void;
  renderContent: (id: string, type: WindowTypes) => ReactElement | null;
  onWindowMinimized: (id: string) => void;
  onWindowClosed: (id: string) => void;
  onSetWindowTitle: (id: string, title: string) => void;
  onWindowRestored: (id: string) => void;
}

const BodyRectangle: ClientRect = document.body.getBoundingClientRect();
const WindowManager: React.FC<Props> = (props: Props): ReactElement | null => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const {renderContent} = props;
  if (!props.windows)
    return null;
  const entries: [string, Window][] = Object
    .entries(props.windows);
  // Get non-minimized windows
  const windows: [string, Window][] = entries;
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
    return (
      <WindowElement geometry={geometry} onGeometryChange={updateGeometry} key={id} forbidden={[]} area={area}
                     onClose={onClose} onMinimize={onMinimize} onSetTitle={onSetTitle} isMinimized={window.minimized}>
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
    <div className={'workspace'} ref={setElement}>
      {windows.map(windowMapper)}
      <div className={'minimized-window-buttons'}>
        {minimized.map(minimizedWindowMapper)}
      </div>
    </div>
  );
};

export {WindowManager};
