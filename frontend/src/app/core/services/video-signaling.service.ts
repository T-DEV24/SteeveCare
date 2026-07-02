import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VideoSignalMessage {
  roomId: string;
  type: 'join' | 'offer' | 'answer' | 'ice' | 'hangup';
  senderId: string;
  payload?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class VideoSignalingService {
  private readonly wsUrl = environment.apiUrl
    .replace(/^http/i, 'ws')
    .replace(/\/api\/?$/, '/ws');

  private readonly client = new Client({
    brokerURL: this.wsUrl,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    forceBinaryWSFrames: false,
    appendMissingNULLonIncoming: true,
    onStompError: (frame) => console.error('Erreur STOMP vidéo', frame.headers['message']),
    onWebSocketError: (event) => console.error('Erreur WebSocket vidéo', event)
  });

  connect(): Promise<void> {
    if (this.client.connected) return Promise.resolve();

    return new Promise((resolve) => {
      this.client.onConnect = () => resolve();
      if (!this.client.active) this.client.activate();
    });
  }

  disconnect(): void {
    if (this.client.active) this.client.deactivate();
  }

  watchRoom(roomId: string): Observable<VideoSignalMessage> {
    return new Observable<VideoSignalMessage>((observer) => {
      let subscription: StompSubscription | undefined;
      this.connect().then(() => {
        subscription = this.client.subscribe(`/topic/consultations/${roomId}/video`, (message: IMessage) => {
          observer.next(JSON.parse(message.body) as VideoSignalMessage);
        });
      });

      return () => subscription?.unsubscribe();
    });
  }

  async send(message: VideoSignalMessage): Promise<void> {
    await this.connect();
    this.client.publish({
      destination: '/app/consultations.video',
      body: JSON.stringify(message),
      headers: { 'content-type': 'application/json;charset=UTF-8' }
    });
  }
}
