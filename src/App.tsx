import { useState } from 'react';
import './App.css';
import { Mic, Square, Settings, Guitar, Activity, Volume2 } from 'lucide-react';
import TabTicker from './components/TabTicker';
import { useAudioProcessor } from './hooks/useAudioProcessor';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const { pitch, tabNote } = useAudioProcessor(isRecording);

  return (
    <div className="app-container">
      <header className="glass">
        <div className="logo">
          <Activity className="accent-icon" />
          <h1 className="glow-text">TabTicker</h1>
        </div>
        <div className="controls">
          <button
            className={`premium-button ${isRecording ? 'recording' : ''}`}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? <Square size={20} /> : <Mic size={20} />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button className="icon-button glass">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main>
        <section className="ticker-wrapper glass">
          <TabTicker currentNote={tabNote} isRecording={isRecording} />
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
              <span className="stat-value">{isRecording ? 'Listening...' : 'Idle'}</span>
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
