import React from "react";
import styled from "styled-components";

interface TBProps {
  onGrab: (event: MouseEvent) => void;
  title: string | null;
  toggleDock: () => void;
  onMinimize: () => void;
  isDocked: boolean;
}

const Container = styled.div`
  padding: 4px 8px;
  border: 1px solid blue;
  display: flex;
`;

const Title = styled.h1`
  flex: 1;
  font-size: 14px;
  margin: 0;
`;

const Button = styled.button`
  background: none;
  border: none;
  font-size: 12px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  pointer-events: all;
`;

export const TitleBar: React.FC<TBProps> = (props: TBProps) => {
  return (
    <Container onMouseDown={props.onGrab as () => void}>
      <Title>{props.title}</Title>
      <Button><i className={'fa fa-window-minimize'}/></Button>
      <Button><i className={'fa fa-window-maximize'} onClickCapture={props.toggleDock}/></Button>
    </Container>
  );
};
