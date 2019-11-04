import styled from 'styled-components';

export const Window = styled.div`
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
    transform: translateY(-6vh);
  }
  &.hidden {
    transform: translateY(100%);
  }
`;
