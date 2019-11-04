import styled from 'styled-components';

export const Container = styled.div`
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  height: 100%;
  left: 0;
  width: 100%;
  background-color: ${({theme}) => theme.modalDimBackground};
  text-align: center;
  z-index: ${Number.MAX_SAFE_INTEGER};
  &.hidden {
    visibility: hidden;
  }
`;
