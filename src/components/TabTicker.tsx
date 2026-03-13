import React, { useEffect, useRef, useState } from 'react';
import './TabTicker.css';

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
    const requestRef = useRef<number>();
    const lastNoteRef = useRef<{ string: number; fret: number } | null>(null);
    const lastNoteTime = useRef<number>(0);

    const moveNotes = (time: number) => {
        setNotes((prevNotes) => {
            // Move existing notes to the left
            const nextNotes = prevNotes
                .map((n) => ({ ...n, position: n.position - 0.5 })) // Speed of scrolling
                .filter((n) => n.position > -10); // Remove notes off-screen

            // Check if we should add a new note
            const now = Date.now();
            if (isRecording && currentNote && (
                !lastNoteRef.current ||
                lastNoteRef.current.string !== currentNote.string ||
                lastNoteRef.current.fret !== currentNote.fret ||
                now - lastNoteTime.current > 300 // Debounce/Min note duration
            )) {
                nextNotes.push({
                    id: now.toString(),
                    string: currentNote.string,
                    fret: currentNote.fret,
                    position: 100, // Start from the right
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
    }, [isRecording, currentNote]);

    return (
        <div className="tab-ticker-container">
            <div className="tab-lines">
                {[1, 2, 3, 4, 5, 6].map((line) => (
                    <div key={line} className="tab-line">
                        <span className="string-name">{['e', 'B', 'G', 'D', 'A', 'E'][line - 1]}</span>
                    </div>
                ))}
            </div>
            <div className="scanner-line"></div>
            <div className="notes-container">
                {notes.map((note) => (
                    <div
                        key={note.id}
                        className="note-bubble"
                        style={{
                            left: `${note.position}%`,
                            top: `${(note.string - 1) * 20 + 2}px`, // Adjusted for alignment
                            transform: 'translateY(-50%)',
                        }}
                    >
                        {note.fret}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TabTicker;
