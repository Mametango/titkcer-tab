import React, { useEffect, useRef, useState } from 'react';
import './TabTicker.css';
import { Trash2, ChevronUp, ChevronDown, Play, Pause, Save } from 'lucide-react';

interface TabNote {
    id: string;
    string: number; // 1-6
    fret: number;
    position: number; // 0-100 (percentage from left)
}

interface SavedTab {
    id: string;
    name: string;
    notes: TabNote[];
    date: string;
}

interface TabTickerProps {
    currentNote: { string: number; fret: number } | null;
    isRecording: boolean;
}

const TabTicker: React.FC<TabTickerProps> = ({ currentNote, isRecording }) => {
    const [notes, setNotes] = useState<TabNote[]>([]);
    const [savedTabs, setSavedTabs] = useState<SavedTab[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [newSaveName, setNewSaveName] = useState('');

    const requestRef = useRef<number | undefined>(undefined);
    const lastNoteRef = useRef<{ string: number; fret: number } | null>(null);
    const lastNoteTime = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial load of the file list from localStorage
    useEffect(() => {
        const savedList = localStorage.getItem('tabticker_save_list');
        if (savedList) {
            try {
                setSavedTabs(JSON.parse(savedList));
            } catch (e) {
                console.error("Failed to load save list", e);
            }
        }

        // Load the last session notes if they exist
        const lastSession = localStorage.getItem('tabticker_last_session');
        if (lastSession) {
            try {
                setNotes(JSON.parse(lastSession));
            } catch (e) { /* ignore */ }
        }
    }, []);

    // Save to last session on every note change
    useEffect(() => {
        if (notes.length > 0) {
            localStorage.setItem('tabticker_last_session', JSON.stringify(notes));
        }
    }, [notes]);

    const moveNotes = () => {
        setNotes((prevNotes) => {
            // Priority: selected note (static mode) > manual pause > movement
            if (selectedNoteId && !isRecording) return prevNotes;
            if (isPaused && !isRecording) return prevNotes;

            const speed = isRecording || !isPaused ? 0.5 : 0;
            const nextNotes = prevNotes
                .map((n) => ({ ...n, position: n.position - speed }))
                .filter((n) => n.position > -10);

            const now = Date.now();
            if (isRecording && currentNote && (
                !lastNoteRef.current ||
                lastNoteRef.current.string !== currentNote.string ||
                lastNoteRef.current.fret !== currentNote.fret ||
                now - lastNoteTime.current > 300
            )) {
                nextNotes.push({
                    id: now.toString(),
                    string: currentNote.string,
                    fret: currentNote.fret,
                    position: 100,
                });
                lastNoteRef.current = currentNote;
                lastNoteTime.current = now;
            } else if (!currentNote) {
                lastNoteRef.current = null;
            }

            return nextNotes;
        });
        requestRef.current = requestAnimationFrame(moveNotes);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(moveNotes);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isRecording, currentNote, selectedNoteId, isPaused]);

    const handleContainerClick = () => {
        if (!selectedNoteId) {
            setIsPaused(!isPaused);
        }
    };

    const handleNoteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedNoteId(selectedNoteId === id ? null : id);
        if (!isRecording) setIsPaused(true); // Auto pause when editing
    };

    const handleLineClick = (e: React.MouseEvent, stringIndex: number) => {
        if (isRecording) return;
        e.stopPropagation();

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const position = (x / rect.width) * 100;

        const newNote: TabNote = {
            id: Date.now().toString(),
            string: stringIndex + 1,
            fret: 0,
            position,
        };

        setNotes(prev => [...prev, newNote]);
        setSelectedNoteId(newNote.id);
        setIsPaused(true);
    };

    const updateSelectedNote = (update: Partial<TabNote>) => {
        setNotes(prev => prev.map(n => n.id === selectedNoteId ? { ...n, ...update } : n));
    };

    const deleteSelectedNote = () => {
        setNotes(prev => prev.filter(n => n.id !== selectedNoteId));
        setSelectedNoteId(null);
    };

    const handleSave = () => {
        if (!newSaveName.trim()) return;
        const newSave: SavedTab = {
            id: Date.now().toString(),
            name: newSaveName,
            notes: [...notes],
            date: new Date().toLocaleString()
        };
        const newList = [newSave, ...savedTabs];
        setSavedTabs(newList);
        localStorage.setItem('tabticker_save_list', JSON.stringify(newList));
        setIsSaveModalOpen(false);
        setNewSaveName('');
        alert(`Saved as "${newSave.name}"`);
    };

    const handleLoad = (tab: SavedTab) => {
        setNotes(tab.notes);
        setIsLoadModalOpen(false);
        setIsPaused(true);
        alert(`Loaded "${tab.name}"`);
    };

    const handleDeleteSave = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newList = savedTabs.filter(t => t.id !== id);
        setSavedTabs(newList);
        localStorage.setItem('tabticker_save_list', JSON.stringify(newList));
    };

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    return (
        <div
            className="tab-ticker-container"
            ref={containerRef}
            onClick={handleContainerClick}
            style={{ cursor: isRecording ? 'default' : 'pointer' }}
        >
            <div className={`playback-indicator ${!isPaused || isRecording ? 'playing' : ''}`}>
                <span></span>
                {!isPaused || isRecording ? 'PLAYING' : 'PAUSED'}
            </div>

            <div className="tab-lines">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div
                        key={idx}
                        className="tab-line"
                        onClick={(e) => handleLineClick(e, idx)}
                    >
                        <span className="string-name">{['e', 'B', 'G', 'D', 'A', 'E'][idx]}</span>
                    </div>
                ))}
            </div>

            <div className="scanner-line"></div>

            <div className="notes-container">
                {notes.map((note) => (
                    <div
                        key={note.id}
                        className={`note-bubble ${selectedNoteId === note.id ? 'selected' : ''}`}
                        style={{
                            left: `${note.position}%`,
                            top: `${(note.string - 1) * 20 + 20}px`,
                            transform: 'translateY(-50%)',
                        }}
                        onClick={(e) => handleNoteClick(e, note.id)}
                    >
                        {note.fret}
                    </div>
                ))}
            </div>

            <div className="ticker-controls" style={{ position: 'absolute', top: '10px', left: '20px', display: 'flex', gap: '8px', zIndex: 20 }}>
                <button className={`hud-button ${isPaused ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}>
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                </button>
                <button className="hud-button" onClick={(e) => { e.stopPropagation(); setIsSaveModalOpen(true); setIsPaused(true); }}>
                    <Save size={14} />
                    Save As
                </button>
                <button className="hud-button" onClick={(e) => { e.stopPropagation(); setIsLoadModalOpen(true); setIsPaused(true); }}>
                    <Play size={14} style={{ transform: 'rotate(90deg)' }} />
                    Load
                </button>
            </div>

            {/* Save Modal */}
            {isSaveModalOpen && (
                <div className="tab-modal-overlay" onClick={() => setIsSaveModalOpen(false)}>
                    <div className="tab-modal glass" onClick={e => e.stopPropagation()}>
                        <h3>Save Tab As</h3>
                        <input
                            type="text"
                            placeholder="Enter name..."
                            value={newSaveName}
                            onChange={e => setNewSaveName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="hud-button" onClick={() => setIsSaveModalOpen(false)}>Cancel</button>
                            <button className="premium-button" onClick={handleSave} disabled={!newSaveName.trim()}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Modal */}
            {isLoadModalOpen && (
                <div className="tab-modal-overlay" onClick={() => setIsLoadModalOpen(false)}>
                    <div className="tab-modal glass" onClick={e => e.stopPropagation()}>
                        <h3>Saved Tabs</h3>
                        <div className="save-list">
                            {savedTabs.length === 0 ? (
                                <p className="empty-msg">No saved tabs found.</p>
                            ) : (
                                savedTabs.map(tab => (
                                    <div key={tab.id} className="save-item" onClick={() => handleLoad(tab)}>
                                        <div className="save-info">
                                            <span className="save-name">{tab.name}</span>
                                            <span className="save-date">{tab.date}</span>
                                        </div>
                                        <button className="hud-button danger" onClick={(e) => handleDeleteSave(e, tab.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="hud-button" onClick={() => setIsLoadModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedNote && !isRecording && (
                <div className="edit-hud glass" onClick={e => e.stopPropagation()}>
                    <button className="hud-button" onClick={() => updateSelectedNote({ fret: Math.max(0, selectedNote.fret - 1) })}>
                        <ChevronDown size={14} />
                    </button>
                    <span className="hud-label">Fret: {selectedNote.fret}</span>
                    <button className="hud-button" onClick={() => updateSelectedNote({ fret: selectedNote.fret + 1 })}>
                        <ChevronUp size={14} />
                    </button>
                    <div className="divider" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <button className="hud-button" onClick={() => updateSelectedNote({ string: Math.max(1, selectedNote.string - 1) })}>
                        Str -
                    </button>
                    <button className="hud-button" onClick={() => updateSelectedNote({ string: Math.min(6, selectedNote.string + 1) })}>
                        Str +
                    </button>
                    <button className="hud-button danger" onClick={deleteSelectedNote}>
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TabTicker;
