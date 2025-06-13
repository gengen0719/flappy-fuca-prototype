import React from 'react';
import './Bird.css';

const Bird = ({ position }) => {
  return (
    <div 
      className="bird"
      style={{
        top: `${position}px`,
        left: '50px',
      }}
    >
      <img 
        src="/fu_ca.png" 
        alt="Bird" 
        className="bird-image" 
        style={{ 
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
};

export default Bird;
