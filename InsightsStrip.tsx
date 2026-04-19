import React from 'react';
import './InsightsStrip.css';

const InsightsStrip = () => {
  return (
    <div className="insights-strip">
      <div className="icon-container flex-shrink-0 overflow-hidden">
        <Icon />
      </div>
      <h1 className="title truncate">Title</h1>
      <h2 className="subtitle truncate">Subtitle</h2>
      <button className="card-button overflow-hidden" style={{ width: '220px' }}>
        View Details
      </button>
    </div>
  );
};

export default InsightsStrip;