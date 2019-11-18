import {WindowElement} from 'components/WindowManager/window';
import {Window} from 'interfaces/window';
import React, {ReactElement, useState} from 'react';
import {WindowTypes} from 'redux/constants/workareaConstants';

interface Props {
  windows: { [id: string]: Window };
  onGeometryChange: (id: string, geometry: ClientRect) => void;
  renderContent: (id: string, type: WindowTypes) => ReactElement | null;
  onWindowClosed: (id: string) => void;
}

const BodyRectangle: ClientRect = document.body.getBoundingClientRect();
const WindowManager: React.FC<Props> = (props: Props): ReactElement | null => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const {renderContent} = props;
  if (!props.windows)
    return null;
  const entries: [string, Window][] = Object.entries(props.windows);
  const windowMapper = ([id, window]: [string, Window]): ReactElement => {
    const {type} = window;
    const content: ReactElement | null = renderContent(id, type);
    const geometry: ClientRect | undefined = window.geometry;
    // Geometries of sibling windows
    const updateGeometry = (g: ClientRect) => props.onGeometryChange(id, g);
    const area: ClientRect = element ? new DOMRect(0, 0, element.offsetWidth, element.offsetHeight) : BodyRectangle;
    const onClose = () => props.onWindowClosed(id);
    return (
      <WindowElement geometry={geometry} onGeometryChange={updateGeometry} key={id} forbidden={[]} area={area}
                     onClose={onClose}>
        {content}
      </WindowElement>
    );
  };
  return (
    <div className={'workspace'} ref={setElement}>
      {entries.map(windowMapper)}
    </div>
  );
};

export {WindowManager};
