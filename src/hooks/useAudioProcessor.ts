import { useState, useEffect, useRef, useCallback } from 'react';
import { YIN } from 'pitchfinder';
import { frequencyToTab } from '../utils/music';

export function useAudioProcessor(isRecording: boolean) {
    const [pitch, setPitch] = useState<number | null>(null);
    const [tabNote, setTabNote] = useState<{ string: number; fret: number } | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const detectorRef = useRef<any>(null);

    const startProcessing = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);

            // Using ScriptProcessorNode for simplicity in this project
            // In production, AudioWorklet is preferred.
            const processor = audioContext.createScriptProcessor(2048, 1, 1);
            processorRef.current = processor;

            detectorRef.current = YIN({ sampleRate: audioContext.sampleRate });

            source.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = (e: AudioProcessingEvent) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const detectedPitch = detectorRef.current(inputData);

                if (detectedPitch) {
                    setPitch(detectedPitch);
                    const tab = frequencyToTab(detectedPitch);
                    if (tab) {
                        setTabNote({ string: tab.string, fret: tab.fret });
                    } else {
                        setTabNote(null);
                    }
                } else {
                    setPitch(null);
                    setTabNote(null);
                }
            };
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    }, []);

    const stopProcessing = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setPitch(null);
        setTabNote(null);
    }, []);

    useEffect(() => {
        if (isRecording) {
            startProcessing();
        } else {
            stopProcessing();
        }
        return () => stopProcessing();
    }, [isRecording, startProcessing, stopProcessing]);

    return { pitch, tabNote };
}
