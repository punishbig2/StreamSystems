import styled from 'styled-components';

export const Wrapper = styled.div`
  position: relative;
  margin-left: ${(props: { moving: boolean }) => props.moving ? 30 : 0}%;
  transition: margin-left 0.25s ease-in;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.25);
  background-color: rgba(255, 255, 255, 0.75);
`;