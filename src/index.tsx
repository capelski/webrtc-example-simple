import React, { useMemo, useRef, useState } from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { addTrack, createMediaStream, playMediaStream, stopMediaStream } from './media';
import { StyledTextarea } from './styled-textarea';
import { StyledVideo } from './styled-video';
import { TimerUpdate } from './timer-update';
import {
    EventHandlers,
    addIceCandidates,
    addUserMediaTracks,
    closeConnection,
    closeDataChannel,
    createAndSetAnswer,
    createAndSetOffer,
    createDataChannel,
    initialize,
    sendMessage,
    setRemoteDescription,
} from './webrtc-functions';

interface Message {
    sender: 'You' | 'They';
    text: string;
}

function App() {
    const [connection, setConnection] = useState<RTCPeerConnection>();
    const [dataChannel, setDataChannel] = useState<RTCDataChannel>();
    const [localIceCandidates, setLocalIceCandidates] = useState<RTCIceCandidate[]>([]);
    const [localSession, setLocalSession] = useState<RTCSessionDescriptionInit>();
    const [remoteIceCandidates, setRemoteIceCandidates] = useState('');
    const [remoteSession, setRemoteSession] = useState('');
    const [textMessage, setTextMessage] = useState('');
    const [, forceUpdate] = useState({});

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const { messages, eventHandlers } = useMemo(() => {
        const candidates = new TimerUpdate(setLocalIceCandidates);
        const messages = new TimerUpdate<Message>(() => forceUpdate({}));

        const eventHandlers: EventHandlers = {
            onDataChannelClosed: () => setDataChannel(undefined),
            // Multiple channels could be added but, for simplicity, we only handle one
            onDataChannelOpened: setDataChannel,
            onIceCandidate: candidates.update.bind(candidates),
            onMessageReceived: (message) => messages.update({ sender: 'They', text: message }),
            onRemoteStreamTrack: (track) => {
                addTrack(remoteVideoRef, track);
                forceUpdate({});
            },
        };

        return {
            // messages is exported since we need to update it locally as well
            messages,
            eventHandlers,
        };
    }, []);

    function reset() {
        setConnection(undefined);
        setDataChannel(undefined);
        setLocalIceCandidates([]);
        setLocalSession(undefined);
        setRemoteIceCandidates('');
        setRemoteSession('');
        setTextMessage('');
    }

    return (
        <div>
            <p>
                <button
                    onClick={() => {
                        const nextConnection = initialize(eventHandlers);
                        setConnection(nextConnection);
                    }}
                >
                    Initialize
                </button>
            </p>
            <p>
                <button
                    onClick={() => {
                        if (connection) {
                            createDataChannel(connection, 'data-channel', eventHandlers);
                            // The corresponding state will be set upon onDataChannelOpened
                        }
                    }}
                    disabled={!connection}
                >
                    Create data channel
                </button>
                &emsp;
                <button
                    onClick={async () => {
                        if (connection) {
                            const mediaStream = await createMediaStream();
                            playMediaStream(localVideoRef, mediaStream);
                            addUserMediaTracks(connection, mediaStream.getTracks());
                        }
                    }}
                    disabled={!connection}
                >
                    Create media stream
                </button>
            </p>

            <p>
                <span>Local session</span>
                <StyledTextarea disabled value={localSession ? JSON.stringify(localSession) : ''} />
                <span>Local ICE Candidates</span>
                <StyledTextarea
                    disabled
                    value={localIceCandidates?.length > 0 ? JSON.stringify(localIceCandidates) : ''}
                />
                <button
                    onClick={async () => {
                        if (connection) {
                            const nextOffer = await createAndSetOffer(connection);
                            setLocalSession(nextOffer);
                        }
                    }}
                    disabled={!connection}
                >
                    Create offer
                </button>
                &emsp;
                <button
                    onClick={async () => {
                        if (connection) {
                            const nextAnswer = await createAndSetAnswer(connection);
                            setLocalSession(nextAnswer);
                        }
                    }}
                    disabled={!connection}
                >
                    Create answer
                </button>
            </p>

            <p>
                <span>Remote session</span>
                <StyledTextarea
                    value={remoteSession}
                    onChange={(event) => {
                        setRemoteSession(event.target.value);
                    }}
                />
                <button
                    onClick={() => {
                        if (connection) {
                            setRemoteDescription(connection, JSON.parse(remoteSession));
                        }
                    }}
                    disabled={!connection}
                >
                    Set remote description
                </button>
                <br />
                <span>Remote ICE Candidates</span>
                <StyledTextarea
                    value={remoteIceCandidates}
                    onChange={(event) => {
                        setRemoteIceCandidates(event.target.value);
                    }}
                />
                <button
                    onClick={() => {
                        if (connection) {
                            addIceCandidates(connection, JSON.parse(remoteIceCandidates));
                        }
                    }}
                    disabled={!connection}
                >
                    Set remote ICE candidates
                </button>
            </p>

            <p>
                <span>Messages</span>
                <StyledTextarea
                    value={textMessage}
                    onChange={(event) => {
                        setTextMessage(event.target.value);
                    }}
                />
                <button
                    onClick={() => {
                        if (dataChannel) {
                            messages.update({ sender: 'You', text: textMessage });
                            setTextMessage('');
                            sendMessage(dataChannel, textMessage);
                        }
                    }}
                    disabled={!dataChannel}
                >
                    Send
                </button>
                &emsp;
                <button
                    onClick={() => {
                        if (dataChannel) {
                            closeDataChannel(dataChannel);
                            setDataChannel(undefined);
                        }
                    }}
                    disabled={!dataChannel}
                >
                    Close data channel
                </button>
            </p>

            <div>
                {messages.data.map((message, index) => (
                    <p key={`message-${index}`}>
                        {message.sender}: {message.text}
                    </p>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                <div style={{ marginBottom: 8 }}>
                    <StyledVideo ref={localVideoRef} />
                    <br />
                    <button
                        onClick={() => {
                            stopMediaStream(localVideoRef);
                            forceUpdate({});
                        }}
                        disabled={!localVideoRef.current?.srcObject}
                    >
                        Stop local media stream
                    </button>
                </div>
                <div style={{ marginBottom: 8 }}>
                    <StyledVideo ref={remoteVideoRef} />
                    <br />
                    <button
                        onClick={() => {
                            stopMediaStream(remoteVideoRef);
                            forceUpdate({});
                        }}
                        disabled={!remoteVideoRef.current?.srcObject}
                    >
                        Stop remote media stream
                    </button>
                </div>
            </div>

            <p>
                <button
                    onClick={() => {
                        if (connection) {
                            closeConnection(connection);
                        }
                    }}
                    disabled={!connection}
                >
                    Close connection
                </button>
                &emsp;
                <button onClick={reset} disabled={!connection}>
                    Reset
                </button>
            </p>
        </div>
    );
}

const appPlaceholder = document.getElementById('app-placeholder')!;
const root = ReactDOMClient.createRoot(appPlaceholder);
root.render(<App />);
