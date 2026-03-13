import './App.css';
import { Mic, Square, Settings, Guitar, Activity, Volume2 } from 'lucide-react';
import TabTicker from './components/TabTicker';
import { useAudioProcessor } from './hooks/useAudioProcessor';

function App() {
  const { pitch, tabNote, isProcessing, volume, startProcessing, stopProcessing } = useAudioProcessor();

  const handleToggleRecording = async () => {
    if (isProcessing) {
      stopProcessing();
    } else {
      try {
        await startProcessing();
      } catch (err) {
        console.error("Failed to start recording:", err);
      }
    }
  };

  return (
    <div className="app-container">
      <header className="glass">
        <div className="logo">
          <Activity className="accent-icon" />
          <h1 className="glow-text">TabTicker</h1>
        </div>
        <div className="controls">
          {isProcessing && (
            <div className="vu-meter-container glass">
              <div
                className="vu-meter-bar"
                style={{ height: `${Math.min(100, volume * 1000)}%` }}
              ></div>
            </div>
          )}
          <button
            className={`premium-button ${isProcessing ? 'recording' : ''}`}
            onClick={handleToggleRecording}
          >
            {isProcessing ? <Square size={20} /> : <Mic size={20} />}
            {isProcessing ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button className="icon-button glass">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main>
        <section className="ticker-wrapper glass">
          <TabTicker currentNote={tabNote} isRecording={isProcessing} />
        </section>

        <section className="stats-grid">
          <div className="stat-card glass">
            <Guitar size={18} className="accent-icon" />
            <div className="stat-info">
              <span className="stat-label">Detected Note</span>
              <span className="stat-value">{tabNote ? `String ${tabNote.string} / Fret ${tabNote.fret}` : '---'}</span>
            </div>
          </div>
          <div className="stat-card glass">
            <Volume2 size={18} className="accent-icon" />
            <div className="stat-info">
              <span className="stat-label">Frequency</span>
              <span className="stat-value">{pitch ? `${pitch.toFixed(1)} Hz` : '---'}</span>
            </div>
          </div>
          <div className="stat-card glass">
            <Activity size={18} className="accent-icon" />
            <div className="stat-info">
              <span className="stat-label">Status</span>
              <span className="stat-value">{isProcessing ? 'Listening...' : 'Idle'}</span>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>© 2026 TabTicker - Real-time Guitar Tab Transcription</p>
      </footer>
    </div>
  );
}

export default App;
