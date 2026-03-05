'use client';

import { useRef, useEffect } from 'react';

const typeStyles = {
  system: 'text-hud-cyan',
  info: 'text-hud-text-dim',
  success: 'text-hud-green',
  error: 'text-hud-red',
  warning: 'text-hud-amber',
};

const typeLabels = {
  system: 'SYS',
  info: 'INF',
  success: 'OK ',
  error: 'ERR',
  warning: 'WRN',
};

export default function Terminal({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col" style={{ background: '#020804' }}>
      {/* Header */}
      <div className="flex-shrink-0 h-7 px-3 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between hud-panel relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-display text-[9px] text-hud-green font-semibold tracking-[0.2em]">TERMINAL</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-hud-green opacity-60" />
            <div className="w-1.5 h-1.5 rounded-full bg-hud-amber opacity-40" />
            <div className="w-1.5 h-1.5 rounded-full bg-hud-red opacity-30" />
          </div>
        </div>
        <span className="font-mono text-[8px] text-hud-text-dim tracking-wider">{logs.length} ENTRIES</span>
      </div>

      {/* Log output */}
      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[10px] leading-[18px]">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 animate-fade">
            {log.time && (
              <span className="text-hud-text-dim opacity-40 flex-shrink-0">{log.time}</span>
            )}
            <span className={`flex-shrink-0 ${typeStyles[log.type] || 'text-hud-text-dim'}`}>
              [{typeLabels[log.type] || 'LOG'}]
            </span>
            <span className={typeStyles[log.type] || 'text-hud-text-dim'}>
              {log.text}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-hud-green">▸</span>
          <span className="w-1.5 h-3 bg-hud-green opacity-80" style={{ animation: 'status-pulse 1s infinite' }} />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
