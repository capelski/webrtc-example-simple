import { RefObject } from 'react';
import { videoSize } from './constants';

export function addTrack(elementRef: RefObject<HTMLVideoElement>, track: MediaStreamTrack) {
    if (elementRef.current) {
        if (!elementRef.current.srcObject) {
            playMediaStream(elementRef, new MediaStream([track]));
        } else {
            // Note: adding a track to a playing MediaStream will raise an exception
            (elementRef.current.srcObject as MediaStream).addTrack(track);
        }
    }
}

export function createMediaStream() {
    return navigator.mediaDevices.getUserMedia({
        // audio: true, // Disabled to prevent microphone feedback on same machine connections
        video: videoSize,
    });
}

export function playMediaStream(elementRef: RefObject<HTMLVideoElement>, mediaStream: MediaStream) {
    if (elementRef.current) {
        elementRef.current.srcObject = mediaStream;
        elementRef.current.play();
    }
}

export function stopMediaStream(elementRef: RefObject<HTMLVideoElement>) {
    if (elementRef.current) {
        if (elementRef.current.srcObject) {
            (elementRef.current.srcObject as MediaStream).getTracks().forEach((track) => {
                track.stop();
            });
        }
        elementRef.current.srcObject = null;
    }
}
