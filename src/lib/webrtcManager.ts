// WebRTC and Media Stream Manager for Learnova Live Classroom
// Handles real camera/microphone capture, screen sharing, audio analysis, and peer connection

import { classroomSync } from "./classroomSync";

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

  // ICE configuration with public STUN servers for reliable peer-to-peer WebRTC
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  /**
   * Request user camera and microphone
   */
  public async startLocalMedia(
    video: boolean = true,
    audio: boolean = true
  ): Promise<MediaStream | null> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      console.warn("getUserMedia not supported in this browser");
      return null;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
        audio: audio,
      });

      this.setupAudioAnalysis(this.localStream);
      return this.localStream;
    } catch (err: any) {
      console.warn("Could not acquire real camera/mic (user denied or no device):", err.message);
      return null;
    }
  }

  /**
   * Request user display/screen capture
   */
  public async startScreenShare(): Promise<MediaStream | null> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      console.warn("getDisplayMedia not supported");
      return null;
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Handle screen share stop via browser native UI
      const videoTrack = this.screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopScreenShare();
          classroomSync.broadcast("SCREEN_SHARE_CHANGE", {
            type: "slide",
            slideTitle: "Quadratic Equations",
          });
        };
      }

      return this.screenStream;
    } catch (err) {
      console.warn("User cancelled screen share", err);
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
      const nextState = muted !== undefined ? !muted : !audioTracks[0].enabled;
      audioTracks.forEach((t) => (t.enabled = nextState));
      this.isAudioMuted = !nextState;
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
      const nextState = stopped !== undefined ? !stopped : !videoTracks[0].enabled;
      videoTracks.forEach((t) => (t.enabled = nextState));
      this.isVideoStopped = !nextState;
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
        for (let i = 0; i < bufferLength; i++) {
          sum += this.audioDataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 255) * 100));

        this.audioLevelCallbacks.forEach((cb) => cb(normalized));
        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn("Audio analysis setup skipped:", e);
    }
  }

  public createPeerConnection(
    peerId: string,
    onRemoteStream: (stream: MediaStream) => void
  ): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.rtcConfig);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        classroomSync.broadcast("WEBRTC_ICE", {
          targetPeer: peerId,
          candidate: event.candidate,
        });
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
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
