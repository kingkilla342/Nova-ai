'use client';

export default function StatusBar({ project, fileCount, lineCount, time, activeFile, loading }) {
  return (
    <footer className="flex-shrink-0 hud-panel-strong border-t border-[rgba(0,255,106,0.15)] h-7 px-4 flex items-center justify-between relative z-10">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[14px] text-hud-text-dim tracking-wider">
          NOVA://{project?.name?.toUpperCase() || 'PROJECT'}
        </span>
        <div className="hud-divider-v h-3" />
        <span className="font-mono text-[14px] text-hud-text-dim">{fileCount} FILES</span>
        <div className="hud-divider-v h-3" />
        <span className="font-mono text-[14px] text-hud-text-dim">{lineCount?.toLocaleString()} LINES</span>
        {activeFile && (
          <>
            <div className="hud-divider-v h-3" />
            <span className="font-mono text-[14px] text-hud-green">{activeFile.split('/').pop()}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {loading && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-0.5 bg-hud-green rounded overflow-hidden">
              <div className="loading-bar w-full h-full" />
            </div>
            <span className="font-mono text-[14px] text-hud-amber tracking-wider">PROCESSING</span>
          </div>
        )}
        <span className="font-mono text-[14px] text-hud-text-dim">GEMINI-2.5-FLASH</span>
        <div className="hud-divider-v h-3" />
        <div className="flex items-center gap-1">
          <div className="status-dot" />
          <span className="font-mono text-[14px] text-hud-green tracking-wider">ONLINE</span>
        </div>
        <div className="hud-divider-v h-3" />
        <span className="font-mono text-[14px] text-hud-text-dim tabular-nums">{time}</span>
      </div>
    </footer>
  );
}
