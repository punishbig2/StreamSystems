import React from 'react';
import styled from 'styled-components';

const Layout = styled.div`
  position: absolute;
  border: 1px solid red;
`;

const Tile: React.FC = () => {
  return (
    <Layout/>
  );
};

export default Tile;
