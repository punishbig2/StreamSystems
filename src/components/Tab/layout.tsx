import styled from 'styled-components';

export const Layout = styled.div`
  cursor: default;
  font-size: ${({theme}) => theme.mediumFontSize}px;
  font-weight: ${({theme}) => theme.mediumFontWeight};
  &:not(:last-child) {
    color: #888;
    margin: -1px 0 0 0;
    opacity: 0.5;
    border-top: 2px solid transparent;
    &.active {
      border-color: blue;
      color: #333;
      opacity: 1;
    }
    &:not(.active):hover {
      opacity: 1;
    }
    transition: opacity 0.25s;
  }
`;
