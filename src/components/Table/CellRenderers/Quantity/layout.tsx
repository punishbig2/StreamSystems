import styled from 'styled-components';

export const SizeLayout = styled.div`
  line-height: ${({theme}) => theme.tableRowSize}px;
  text-align: center;
  white-space: nowrap;
  div {
    text-align: center;
    color: ${({theme}) => theme.textColorBlue};
    line-height: ${({theme}) => theme.tableRowSize}px;
    height: ${({theme}) => theme.tableRowSize}px; 
    display: inline-block;
    vertical-align: top;
    margin: 0 4px;
    &.times {
      color: ${({theme}) => theme.tableCellRed};
      line-height: ${({theme}) => theme.tableRowSize - 2}px;
      width: ${({theme}) => theme.tableRowSize - 2}px;
      padding: 1px 0;
      &:not(.clickable) {
        color: transparent;
      }
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
    width: calc(100% - 30px);
    text-overflow: ellipsis;
    overflow: hidden;
  }
`;
