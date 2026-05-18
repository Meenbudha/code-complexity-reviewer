import React from 'react';

/* ─── Individual shimmer block ─────────────────────────────────────────── */
function Bone({ width = '100%', height = '16px', style = {} }) {
  return (
    <div
      className="skeleton-bone"
      style={{ width, height, borderRadius: '4px', ...style }}
    />
  );
}

/* ─── Full skeleton that mirrors ResultPanel layout ─────────────────────── */
function SkeletonLoader() {
  return (
    <div className="skeleton-wrapper" aria-label="Loading analysis..." aria-busy="true">

      {/* TC / SC cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {/* Time Complexity card */}
        <div className="skeleton-card skeleton-card--primary">
          <Bone width="55%" height="11px" style={{ marginBottom: '10px' }} />
          <Bone width="40%" height="22px" />
        </div>
        {/* Space Complexity card */}
        <div className="skeleton-card skeleton-card--secondary">
          <Bone width="55%" height="11px" style={{ marginBottom: '10px' }} />
          <Bone width="40%" height="22px" />
        </div>
      </div>

      {/* Warnings block */}
      <div className="skeleton-section skeleton-section--warning">
        <Bone width="30%" height="13px" style={{ marginBottom: '12px' }} />
        <Bone width="90%" height="12px" style={{ marginBottom: '8px' }} />
        <Bone width="75%" height="12px" />
      </div>

      {/* Tips block */}
      <div className="skeleton-section skeleton-section--tip">
        <Bone width="20%" height="13px" style={{ marginBottom: '12px' }} />
        <Bone width="85%" height="12px" style={{ marginBottom: '8px' }} />
        <Bone width="65%" height="12px" />
      </div>

    </div>
  );
}

export default SkeletonLoader;
