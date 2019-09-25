import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.025);
  background-color: rgba(245, 245, 245, 0.75);
  box-sizing: border-box;
  overflow: hidden;
  &.floating {
    box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    border: none;
  }
`;
