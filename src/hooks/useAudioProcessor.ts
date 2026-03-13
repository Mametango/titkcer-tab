import { useState, useEffect, useRef, useCallback } from 'react';
import { YIN } from 'pitchfinder';
import { frequencyToTab } from '../utils/music';

export function useAudioProcessor() {
    const [pitch, setPitch] = useState<number | null>(null);
    const [tabNote, setTabNote] = useState<{ string: number; fret: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const detectorRef = useRef<any>(null);

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
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        setPitch(null);
        setTabNote(null);
        setIsProcessing(false);
    }, []);

    const startProcessing = useCallback(async () => {
        try {
            // Stop any existing processing
            stopProcessing();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();

            // Explicitly resume AudioContext for Safari/Chrome
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(2048, 1, 1);
            processorRef.current = processor;

            detectorRef.current = YIN({ sampleRate: audioContext.sampleRate });

            source.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = (e: AudioProcessingEvent) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const detectedPitch = detectorRef.current(inputData);

                if (detectedPitch && detectedPitch > 50 && detectedPitch < 1200) {
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

            setIsProcessing(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setIsProcessing(false);
            throw err;
        }
    }, [stopProcessing]);

    useEffect(() => {
        return () => {
            stopProcessing();
        };
    }, [stopProcessing]);

    return { pitch, tabNote, isProcessing, startProcessing, stopProcessing };
}
