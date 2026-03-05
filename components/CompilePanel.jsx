'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getGitHubCreds, saveGitHubCreds, clearGitHubCreds,
  verifyToken, ensureRepo, pushFiles,
  getBuildStatus, getArtifactUrl, downloadArtifact,
} from '../lib/github-compile';

export default function CompilePanel({ project, files, onClose }) {
  const [step, setStep] = useState('setup'); // setup, pushing, building, done, error
  const [creds, setCreds] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [repoName, setRepoName] = useState('');
  const [buildStatus, setBuildStatus] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [logs, setLogs] = useState([]);
  const pollRef = useRef(null);

  const fileCount = Object.keys(files).length;

  useEffect(() => {
    const saved = getGitHubCreds();
    if (saved) {
      setCreds(saved);
      setStep('ready');
    }
    const safeName = (project.name || 'nova-plugin').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    setRepoName(safeName);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [project]);

  const addLog = (text) => setLogs(prev => [...prev, { text, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }]);

  // Step 1: Connect GitHub
  const handleConnect = async () => {
    if (!tokenInput.trim()) return;
    setVerifying(true);
    setError('');
    try {
      const result = await verifyToken(tokenInput.trim());
      if (result.valid) {
        const newCreds = { token: tokenInput.trim(), username: result.username, avatar: result.avatar };
        saveGitHubCreds(newCreds);
        setCreds(newCreds);
        setStep('ready');
        addLog(`Connected as ${result.username}`);
      } else {
        setError('Invalid token. Make sure it has repo access.');
      }
    } catch (err) {
      setError('Connection failed: ' + err.message);
    }
    setVerifying(false);
  };

  const handleDisconnect = () => {
    clearGitHubCreds();
    setCreds(null);
    setStep('setup');
    setTokenInput('');
  };

  // Step 2: Push & Build
  const handleCompile = async () => {
    if (!creds || !repoName) return;
    setStep('pushing');
    setError('');
    setBuildStatus(null);
    setArtifact(null);

    try {
      // Detect Java version from project
      const javaVersion = project.mcVersion && parseFloat(project.mcVersion) >= 1.20 ? 21 :
                          project.mcVersion && parseFloat(project.mcVersion) >= 1.17 ? 17 : 11;

      addLog('Creating repository...');
      const { created } = await ensureRepo(creds.token, repoName);
      addLog(created ? `Created repo: ${repoName}` : `Using existing repo: ${repoName}`);

      addLog(`Pushing ${fileCount} files...`);
      setStep('pushing');
      await pushFiles(creds.token, creds.username, repoName, files, javaVersion);
      addLog('Files pushed. Build triggered.');

      // Wait a moment for Actions to start
      setStep('building');
      addLog('Waiting for GitHub Actions...');

      // Poll for build status
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const status = await getBuildStatus(creds.token, creds.username, repoName);
          setBuildStatus(status);

          if (status.status === 'completed') {
            clearInterval(pollRef.current);
            pollRef.current = null;

            if (status.conclusion === 'success') {
              addLog('Build successful!');
              // Get artifact
              const art = await getArtifactUrl(creds.token, creds.username, repoName, status.id);
              if (art) {
                setArtifact(art);
                addLog(`JAR ready: ${(art.size / 1024).toFixed(0)}KB`);
              } else {
                addLog('Build succeeded but no artifact found. Check the Actions tab on GitHub.');
              }
              setStep('done');
            } else {
              addLog(`Build failed: ${status.conclusion}`);
              setError(`Build failed. Check errors at: github.com/${creds.username}/${repoName}/actions`);
              setStep('error');
            }
          } else if (status.status === 'in_progress') {
            if (attempts % 3 === 0) addLog('Still building...');
          }

          // Timeout after 5 min
          if (attempts > 60) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            addLog('Build is taking long. Check GitHub Actions directly.');
            setStep('done');
          }
        } catch (err) {
          if (attempts > 5) {
            clearInterval(pollRef.current);
            addLog('Could not check build status.');
          }
        }
      }, 5000);

    } catch (err) {
      setError(err.message);
      addLog('Error: ' + err.message);
      setStep('error');
    }
  };

  // Download JAR
  const handleDownload = async () => {
    if (!artifact?.downloadUrl || !creds) return;
    try {
      addLog('Downloading JAR...');
      const blob = await downloadArtifact(creds.token, artifact.downloadUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repoName}.zip`; // GitHub wraps artifacts in zip
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addLog('Download started.');
    } catch (err) {
      addLog('Download failed: ' + err.message);
    }
  };

  const statusColor = {
    queued: 'text-hud-amber',
    in_progress: 'text-hud-cyan',
    completed: 'text-hud-green',
    none: 'text-hud-text-dim',
    error: 'text-hud-red',
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade">
      <div className="hud-panel-strong hud-corners hud-corners-bottom rounded-lg w-full max-w-lg mx-4 overflow-hidden animate-materialize">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-hud-green">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <h2 className="font-display font-bold text-hud-green tracking-[0.15em] text-base">COMPILE TO JAR</h2>
          </div>
          <button onClick={onClose} className="text-hud-text-dim hover:text-hud-red transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* GitHub Setup */}
          {!creds ? (
            <div className="space-y-4">
              <div className="glass-card rounded-lg p-4">
                <p className="font-display text-base text-hud-text-bright mb-3">Connect GitHub (one-time setup)</p>
                <div className="space-y-3">
                  <div>
                    <p className="font-sans text-[13px] text-hud-text-dim mb-1">1. Go to <span className="text-hud-green">github.com/settings/tokens</span></p>
                    <p className="font-sans text-[13px] text-hud-text-dim mb-1">2. Click <span className="text-hud-green">Generate new token (classic)</span></p>
                    <p className="font-sans text-[13px] text-hud-text-dim mb-1">3. Check the <span className="text-hud-green">repo</span> and <span className="text-hud-green">workflow</span> boxes</p>
                    <p className="font-sans text-[13px] text-hud-text-dim">4. Paste it below</p>
                  </div>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full px-4 py-3 rounded hud-input text-base"
                  />
                  {error && <p className="font-sans text-[13px] text-hud-red">{error}</p>}
                  <button
                    onClick={handleConnect}
                    disabled={!tokenInput.trim() || verifying}
                    className="w-full hud-btn-primary px-5 py-3 rounded font-display text-base tracking-wider font-bold disabled:opacity-40"
                  >
                    {verifying ? 'VERIFYING...' : 'CONNECT GITHUB'}
                  </button>
                </div>
              </div>
              <p className="font-sans text-[12px] text-hud-text-dim text-center">
                Token is stored locally in your browser. Never sent to Nova servers.
              </p>
            </div>
          ) : (
            <>
              {/* Connected status */}
              <div className="glass-card rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[rgba(0,255,106,0.1)] flex items-center justify-center overflow-hidden">
                    {creds.avatar ? (
                      <img src={creds.avatar} alt="" className="w-full h-full rounded-full" />
                    ) : (
                      <span className="font-display text-hud-green text-[13px] font-bold">{creds.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-display text-[14px] text-hud-green">{creds.username}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="status-dot" style={{ width: 5, height: 5 }} />
                      <span className="font-sans text-[12px] text-hud-text-dim">Connected</span>
                    </div>
                  </div>
                </div>
                <button onClick={handleDisconnect} className="hud-btn px-3 py-2 rounded text-[12px] tracking-wider">
                  DISCONNECT
                </button>
              </div>

              {/* Repo name */}
              <div>
                <label className="block font-display text-[12px] text-hud-text-dim tracking-[0.2em] uppercase mb-1.5">REPOSITORY NAME</label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, '-'))}
                  className="w-full px-4 py-3 rounded hud-input text-base"
                  disabled={step === 'pushing' || step === 'building'}
                />
                <p className="font-sans text-[12px] text-hud-text-dim mt-1">
                  github.com/{creds.username}/{repoName}
                </p>
              </div>

              {/* Project info */}
              <div className="glass-card rounded-lg p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    [fileCount, 'FILES'],
                    [project.mcVersion || '1.20.4', 'MC VER'],
                    [project.type?.toUpperCase() || 'PLUGIN', 'TYPE'],
                  ].map(([v, l]) => (
                    <div key={l}>
                      <div className="font-display text-xl text-hud-green">{v}</div>
                      <div className="font-sans text-[11px] text-hud-text-dim tracking-wider">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Build status */}
              {buildStatus && (
                <div className="glass-card rounded-lg p-4 animate-slide-up">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-[13px] tracking-wider text-hud-text-bright">BUILD STATUS</span>
                    <span className={`font-display text-[13px] tracking-wider ${statusColor[buildStatus.status] || 'text-hud-text-dim'}`}>
                      {buildStatus.status === 'in_progress' ? 'BUILDING...' :
                       buildStatus.conclusion === 'success' ? 'SUCCESS' :
                       buildStatus.conclusion === 'failure' ? 'FAILED' :
                       buildStatus.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  {buildStatus.status === 'in_progress' && (
                    <div className="w-full h-1 rounded bg-[rgba(0,255,106,0.1)] overflow-hidden">
                      <div className="loading-bar w-full h-full" />
                    </div>
                  )}
                  {buildStatus.url && (
                    <a href={buildStatus.url} target="_blank" rel="noopener noreferrer"
                       className="font-sans text-[12px] text-hud-cyan hover:underline mt-2 block">
                      View on GitHub →
                    </a>
                  )}
                </div>
              )}

              {/* Artifact download */}
              {artifact && (
                <div className="glass-card rounded-lg p-4 border-[rgba(0,255,106,0.3)] glow animate-slide-up">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📦</span>
                    <div>
                      <p className="font-display text-base text-hud-green text-glow">JAR READY</p>
                      <p className="font-sans text-[12px] text-hud-text-dim">{(artifact.size / 1024).toFixed(0)}KB</p>
                    </div>
                  </div>
                  <button onClick={handleDownload} className="w-full hud-btn-primary px-5 py-3 rounded font-display text-base tracking-wider font-bold">
                    DOWNLOAD JAR
                  </button>
                </div>
              )}

              {/* Logs */}
              {logs.length > 0 && (
                <div className="glass rounded-lg p-3 max-h-32 overflow-y-auto">
                  {logs.map((l, i) => (
                    <div key={i} className="font-mono text-[12px] text-hud-text-dim flex gap-2">
                      <span className="text-hud-text-dim opacity-50 flex-shrink-0">{l.time}</span>
                      <span>{l.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="font-sans text-[13px] text-hud-red">{error}</p>}

              {/* Compile button */}
              {(step === 'ready' || step === 'error' || step === 'done') && !artifact && (
                <button
                  onClick={handleCompile}
                  disabled={!repoName}
                  className="w-full hud-btn-primary px-5 py-3 rounded font-display text-base tracking-wider font-bold disabled:opacity-40"
                >
                  PUSH & COMPILE
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(0,255,106,0.1)] flex items-center justify-between">
          <span className="font-sans text-[12px] text-hud-text-dim">
            {step === 'building' ? 'Compiling via GitHub Actions (free)...' :
             step === 'done' ? 'Build complete' :
             'Powered by GitHub Actions'}
          </span>
          <button onClick={onClose} className="hud-btn px-4 py-2 rounded text-[13px] tracking-wider">CLOSE</button>
        </div>
      </div>
    </div>
  );
}
