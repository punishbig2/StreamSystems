import styled from 'styled-components';

export const DirectionLayout = styled.div`
  position: absolute;
  width: 16px;
  left: 16px;
  top: 0;
  bottom: 0;
  pointer-events: none;
  i.fa-long-arrow-alt-up {
    color: seagreen;;
  }
  i.fa-long-arrow-alt-down {
    color: crimson;;
  }
`;
