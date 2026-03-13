import React, { useEffect, useRef, useState } from 'react';
import './TabTicker.css';
import { Trash2, ChevronUp, ChevronDown, Play, Pause, Save } from 'lucide-react';

interface TabNote {
    id: string;
    string: number; // 1-6
    fret: number;
    position: number; // 0-100 (percentage from left)
}

interface TabTickerProps {
    currentNote: { string: number; fret: number } | null;
    isRecording: boolean;
}

const TabTicker: React.FC<TabTickerProps> = ({ currentNote, isRecording }) => {
    const [notes, setNotes] = useState<TabNote[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const requestRef = useRef<number | undefined>(undefined);
    const lastNoteRef = useRef<{ string: number; fret: number } | null>(null);
    const lastNoteTime = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('tabticker_notes');
        if (saved) {
            try {
                setNotes(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load notes", e);
            }
        }
    }, []);

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

    const saveNotes = () => {
        localStorage.setItem('tabticker_notes', JSON.stringify(notes));
        alert("Saved successfully!");
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
                <button className="hud-button" onClick={(e) => { e.stopPropagation(); saveNotes(); }}>
                    <Save size={14} />
                    Save
                </button>
            </div>

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
