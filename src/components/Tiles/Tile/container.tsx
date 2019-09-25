import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  height: 100%;
  outline: 1px solid rgba(0, 0, 0, 0.5);
  background-color: rgba(64, 64, 64, 0.95);
  box-sizing: border-box;
  overflow: hidden;
  &.floating {
    box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.55);
    border-radius: 4px;
    outline: none;
  }
`;
