import styled from 'styled-components';

export const SizeLayout = styled.div`
  line-height: ${({theme}) => theme.tableRowSize}px;
  text-align: center;
  box-sizing: border-box;
  div {
    display: inline-block;
    text-align: center;
    box-sizing: border-box;
    width: 50%;
    color: ${({theme}) => theme.tableXColor};
    line-height: ${({theme}) => theme.tableRowSize}px;
    height: ${({theme}) => theme.tableRowSize}px; 
    vertical-align: top;
    &.times {
      color: ${({theme}) => theme.tableCellRed};
      line-height: 22px;
      width: 22px;
      padding: 4px 0;
      &:hover {
        &::after {
          background-color: rgba(0, 0, 0, 0.15);
        }
        cursor: default;
      }
      &::after {
        display: inline-block;
        content: '\u00D7';
        border-radius: 100px;
        line-height: 22px;
        width: 22px;
        height: 22px;
      }
      &:active {
        transform: translateY(1px);
      }
    }
  }
`;
