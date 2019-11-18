import styled from 'styled-components';

export const TooltipContent = styled.div`
  position: absolute;
  background-color: white;
  padding: 8px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  font-size: ${({theme}) => theme.tableFontSize}px;
  font-weight: ${({theme}) => theme.tableFontWeight};
  font-family: ${({theme}) => theme.tableFontFamily};
`;