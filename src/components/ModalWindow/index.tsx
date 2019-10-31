import React, {ReactElement, useEffect, useState} from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: fixed;
  top: 0;
  height: 100%;
  left: 0;
  width: 100%;
  background-color: ${({theme}) => theme.modalDimBackground};
  text-align: center;
  line-height: ${(props: { height: number }) => props.height}px;
  z-index: ${Number.MAX_SAFE_INTEGER};
  &.hidden {
    visibility: hidden;
  }
`;
const Window = styled.div`
  display: inline-block;
  background-color: white;
  text-align: initial;
  line-height: normal;
  padding: 16px;
  border-radius: ${({theme}) => theme.modalBorderRadius}px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.175);
  h1 {
    margin: 0;
  }
  transition: transform 0.25s;
  &.visible {
    transform: translateY(-5vh) rotate(0);
  }
  &.hidden {
    transform: translateY(100%) rotate(-30deg);
  }
`;

interface Props {
  render: (props: any) => ReactElement;
  visible: boolean;
}

const ModalWindow: React.FC<Props> = (props: Props): ReactElement | null => {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  useEffect(() => {
    const updateWindowHeight = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', updateWindowHeight);
    return () => {
      window.removeEventListener('resize', updateWindowHeight);
    };
  }, []);
  const className = props.visible ? 'visible' : 'hidden';
  return (
    <Container height={windowHeight} className={className}>
      <Window className={className}>
        {props.render(props)}
      </Window>
    </Container>
  );
};

export {ModalWindow};
