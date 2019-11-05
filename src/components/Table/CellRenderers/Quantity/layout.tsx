import styled from 'styled-components';

export const SizeLayout = styled.div`
  display: flex;
  line-height: ${({theme}) => theme.tableRowSize}px;
  text-align: center;
  box-sizing: border-box;
  white-space: nowrap;
  div {
    text-align: center;
    box-sizing: border-box;
    color: ${({theme}) => theme.tableXColor};
    line-height: ${({theme}) => theme.tableRowSize}px;
    height: ${({theme}) => theme.tableRowSize}px; 
    vertical-align: top;
    &.times {
      color: ${({theme}) => theme.tableCellRed};
      line-height: ${({theme}) => theme.tableRowSize - 2}px;
      width: ${({theme}) => theme.tableRowSize - 2}px;
      padding: 1px 0;
      &.clickable:hover {
        &::after {
          background-color: ${({theme}) => theme.tableHoverColor};
        }
        cursor: default;
      }
      &.clickable:active {
        transform: translateY(1px);
      }
      &::after {
        display: inline-block;
        content: '\u00D7';
        border-radius: 100px;
        line-height: 22px;
        width: 22px;
        height: 22px;
      }
    }
  }
  input {
    text-overflow: ellipsis;
    overflow: hidden;
  }
`;
