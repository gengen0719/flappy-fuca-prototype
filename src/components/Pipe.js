import React from 'react';
import './Pipe.css';

const Pipe = ({ x, y = 0, height, isTop, width }) => {
  return (
    <div
      className={`pipe ${isTop ? 'top' : 'bottom'}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        height: `${height}px`,
        width: `${width}px`,
      }}
    />
  );
};

export default Pipe;
