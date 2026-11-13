// Real WebRTC & Media Manager with Bandwidth Presets (Nigerian network friendly)
// + Multi-peer Offer/Answer/ICE signaling relayed through /api/live-classes/[id] & BroadcastChannel

import { classroomSync, VideoQualityPreset } from "./classroomSync";

export type MediaResult = {
  stream: MediaStream | null;
  errorReason: string | null;
};

const QUALITY_MAP: Record<VideoQualityPreset, { width: number; height: number; frameRate: number }> = {
  low: { width: 320, height: 240, frameRate: 15 },
  medium: { width: 640, height: 360, frameRate: 24 },
  high: { width: 1280, height: 720, frameRate: 30 },
};

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private isAudioMuted: boolean = false;
  private isVideoStopped: boolean = false;
  private audioLevelCallbacks: Set<(level: number) => void> = new Set();
  private animFrameId: number | null = null;

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  public async startLocalMedia(
    video: boolean = true,
    audio: boolean = true,
    quality: VideoQualityPreset = "medium"
  ): Promise<MediaResult> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return {
        stream: null,
        errorReason: "Browser does not support camera or microphone capture here.",
      };
    }

    // Stop any previous tracks cleanly
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    const q = QUALITY_MAP[quality];

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video
          ? {
              width: { ideal: q.width },
              height: { ideal: q.height },
              frameRate: { ideal: q.frameRate },
              facingMode: "user",
            }
          : false,
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
            }
          : false,
      });

      this.isAudioMuted = !audio;
      this.isVideoStopped = !video;
      this.setupAudioAnalysis(this.localStream);
      return { stream: this.localStream, errorReason: null };
    } catch (err: any) {
      // Fallback: if camera failed but audio was requested, try audio-only gracefully
      if (video && audio) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          this.isVideoStopped = true;
          this.isAudioMuted = false;
          this.setupAudioAnalysis(this.localStream);
          return {
            stream: this.localStream,
            errorReason: "Camera unavailable — connected with microphone audio.",
          };
        } catch {
          // ignore
        }
      }
      return {
        stream: null,
        errorReason:
          err?.name === "NotAllowedError"
            ? "Camera/microphone permission was denied."
            : "No camera/microphone detected on this device.",
      };
    }
  }

  public async startScreenShare(onNativeStop?: () => void): Promise<MediaStream | null> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      return null;
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15 } },
        audio: false,
      });

      const videoTrack = this.screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopScreenShare();
          onNativeStop?.();
        };
      }
      return this.screenStream;
    } catch {
      return null;
    }
  }

  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
  }

  public getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public toggleMute(muted?: boolean): boolean {
    if (!this.localStream) {
      this.isAudioMuted = muted !== undefined ? muted : !this.isAudioMuted;
      return this.isAudioMuted;
    }

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const nextEnabled = muted !== undefined ? !muted : !audioTracks[0].enabled;
      audioTracks.forEach((t) => (t.enabled = nextEnabled));
      this.isAudioMuted = !nextEnabled;
    } else {
      this.isAudioMuted = muted !== undefined ? muted : !this.isAudioMuted;
    }
    return this.isAudioMuted;
  }

  public toggleVideo(stopped?: boolean): boolean {
    if (!this.localStream) {
      this.isVideoStopped = stopped !== undefined ? stopped : !this.isVideoStopped;
      return this.isVideoStopped;
    }

    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      const nextEnabled = stopped !== undefined ? !stopped : !videoTracks[0].enabled;
      videoTracks.forEach((t) => (t.enabled = nextEnabled));
      this.isVideoStopped = !nextEnabled;
    } else {
      this.isVideoStopped = stopped !== undefined ? stopped : !this.isVideoStopped;
    }
    return this.isVideoStopped;
  }

  public onAudioLevel(callback: (level: number) => void): () => void {
    this.audioLevelCallbacks.add(callback);
    return () => this.audioLevelCallbacks.delete(callback);
  }

  private setupAudioAnalysis(stream: MediaStream) {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (this.audioContext && this.audioContext.state !== "closed") {
        this.audioContext.close().catch(() => {});
      }
      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.audioDataArray = dataArray;

      const checkVolume = () => {
        if (!this.analyser || !this.audioDataArray) return;
        this.analyser.getByteFrequencyData(this.audioDataArray as unknown as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += this.audioDataArray[i];
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 255) * 100));
        this.audioLevelCallbacks.forEach((cb) => cb(normalized));
        this.animFrameId = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch {
      // ignore if audio context blocked
    }
  }

  public createPeerConnection(
    classId: string,
    selfPeerId: string,
    selfRole: "TEACHER" | "STUDENT",
    remotePeerId: string,
    onRemoteStream: (stream: MediaStream) => void
  ): RTCPeerConnection {
    const existing = this.peerConnections.get(remotePeerId);
    if (existing) {
      existing.close();
      this.peerConnections.delete(remotePeerId);
    }

    const pc = new RTCPeerConnection(this.rtcConfig);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }
    if (this.screenStream && selfRole === "TEACHER") {
      this.screenStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.screenStream!);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        classroomSync.dispatchAction(classId, "WEBRTC_SIGNAL", {
          fromPeerId: selfPeerId,
          fromRole: selfRole,
          toPeerId: remotePeerId,
          kind: "ice",
          payload: event.candidate.toJSON(),
        });
      }
    };

    this.peerConnections.set(remotePeerId, pc);
    return pc;
  }

  public async sendOffer(
    classId: string,
    selfPeerId: string,
    selfRole: "TEACHER" | "STUDENT",
    remotePeerId: string,
    onRemoteStream: (stream: MediaStream) => void
  ) {
    try {
      const pc = this.createPeerConnection(
        classId,
        selfPeerId,
        selfRole,
        remotePeerId,
        onRemoteStream
      );
      // Ensure transceiver exists even when camera is missing so one-way receive still works
      if (pc.getTransceivers().length === 0) {
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });
      }
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await classroomSync.dispatchAction(classId, "WEBRTC_SIGNAL", {
        fromPeerId: selfPeerId,
        fromRole: selfRole,
        toPeerId: remotePeerId,
        kind: "offer",
        payload: offer,
      });
    } catch {
      // ignore signaling error when WebRTC unsupported
    }
  }

  public async handleSignal(
    classId: string,
    selfPeerId: string,
    selfRole: "TEACHER" | "STUDENT",
    fromPeerId: string,
    kind: string,
    payload: any,
    onRemoteStream: (stream: MediaStream) => void
  ) {
    try {
      if (kind === "offer") {
        const pc = this.createPeerConnection(
          classId,
          selfPeerId,
          selfRole,
          fromPeerId,
          onRemoteStream
        );
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await classroomSync.dispatchAction(classId, "WEBRTC_SIGNAL", {
          fromPeerId: selfPeerId,
          fromRole: selfRole,
          toPeerId: fromPeerId,
          kind: "answer",
          payload: answer,
        });
      } else if (kind === "answer") {
        const pc = this.peerConnections.get(fromPeerId);
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
        }
      } else if (kind === "ice") {
        const pc = this.peerConnections.get(fromPeerId);
        if (pc && payload) {
          await pc.addIceCandidate(new RTCIceCandidate(payload));
        }
      }
    } catch {
      // ignore out-of-order candidate errors
    }
  }

  public closePeer(remotePeerId: string) {
    const pc = this.peerConnections.get(remotePeerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remotePeerId);
    }
  }

  public closeAll() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.stopScreenShare();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.audioLevelCallbacks.clear();
  }
}

export const webrtcManager = new WebRTCManager();
