export const FREQUENCIES = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
export const NOTES = ['E', 'A', 'D', 'G', 'B', 'e'];

/**
 * Maps a frequency to the nearest guitar note (string and fret).
 * This is a simplified monophonic mapping.
 */
export function frequencyToTab(frequency: number) {
    if (frequency <= 0) return null;

    // MIDI note formula: 12 * log2(f / 440) + 69
    const midi = Math.round(12 * Math.log2(frequency / 440) + 69);

    // Guitar range (Standard tuning): E2 (40) to E6 (88) or so
    if (midi < 40 || midi > 90) return null;

    // We need to decide which string to put it on.
    // Standard tuning open strings (MIDI): 40, 45, 50, 55, 59, 64
    const openStrings = [40, 45, 50, 55, 59, 64];

    // Find the highest string that can play this note (simplification)
    let bestString = 0;
    let fret = -1;

    for (let s = 5; s >= 0; s--) {
        if (midi >= openStrings[s]) {
            const f = midi - openStrings[s];
            if (f <= 22) { // 22 frets max
                bestString = s;
                fret = f;
                break;
            }
        }
    }

    if (fret === -1) return null;

    return {
        string: 6 - bestString, // 1 to 6 (High e is 1, Low E is 6)
        fret,
        midi
    };
}
