import React from 'react';
import styled from 'styled-components';

const ChevronLayout = styled.div`
  position: absolute;
  left: 1px;
  top: 1px;
  width: 12px;
  height: 12px;
  line-height: 12px;
  i {
    font-size: 8px;
    color: crimson;
  }
`;

const Chevron: React.FC = () => {
  return (
    <ChevronLayout>
      <i className={'fa fa-chevron-up'}/>
    </ChevronLayout>
  );
};

export {Chevron};
