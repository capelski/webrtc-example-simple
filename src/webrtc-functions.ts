export interface EventHandlers {
    onDataChannelClosed: () => void;
    onDataChannelOpened: (dataChannel: RTCDataChannel) => void;
    onIceCandidate: (candidate: RTCIceCandidate) => void;
    onMessageReceived: (message: string) => void;
    onRemoteStreamTrack: (track: MediaStreamTrack) => void;
}

export async function addIceCandidates(connection: RTCPeerConnection, remoteCandidates: string) {
    const candidates = JSON.parse(remoteCandidates);
    for (const candidate of candidates) {
        await connection.addIceCandidate(candidate);
    }
}

export function addUserMediaTracks(
    connection: RTCPeerConnection,
    tracks: MediaStreamTrack[],
): RTCRtpSender[] {
    return tracks.map((track) => {
        return connection.addTrack(track);
    });
}

export function closeConnection(connection: RTCPeerConnection) {
    connection.close();
}

export function closeDataChannel(dataChannel: RTCDataChannel) {
    dataChannel.close();
}

export async function createAndSetAnswer(
    connection: RTCPeerConnection,
): Promise<RTCSessionDescriptionInit> {
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    return answer;
}

export function createDataChannel(
    connection: RTCPeerConnection,
    label: string,
    eventHandlers: EventHandlers,
) {
    const dataChannel = connection.createDataChannel(label);

    setDataChannelHandlers(dataChannel, eventHandlers);
}

export async function createAndSetOffer(
    connection: RTCPeerConnection,
): Promise<RTCSessionDescriptionInit> {
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    return offer;
}

export function initialize(uiHandlers: EventHandlers): RTCPeerConnection {
    const connection = new RTCPeerConnection();

    connection.onicecandidate = (event) => {
        /* Each event.candidate generated after creating the offer
        must be added by the peer answering the connection */
        if (event.candidate) {
            uiHandlers.onIceCandidate(event.candidate);
        }
    };

    /* This method will be called when the peer creates a channel */
    connection.ondatachannel = (event) => {
        const dataChannel = event.channel;
        setDataChannelHandlers(dataChannel, uiHandlers);
    };

    /* This method will be called when the peer adds a stream track */
    connection.ontrack = (event) => {
        const { track } = event;
        uiHandlers.onRemoteStreamTrack(track);
    };

    return connection;
}

export function sendMessage(dataChannel: RTCDataChannel, message: string) {
    dataChannel.send(message);
}

function setDataChannelHandlers(dataChannel: RTCDataChannel, uiHandlers: EventHandlers) {
    dataChannel.onopen = () => {
        uiHandlers.onDataChannelOpened(dataChannel);
    };

    dataChannel.onmessage = (event) => {
        const message = event.data;
        uiHandlers.onMessageReceived(message);
    };

    dataChannel.onclose = () => {
        uiHandlers.onDataChannelClosed();
    };
}

export async function setRemoteDescription(
    connection: RTCPeerConnection,
    remoteDescription: string,
) {
    await connection.setRemoteDescription(JSON.parse(remoteDescription));
}
