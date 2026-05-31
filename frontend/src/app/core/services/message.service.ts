// src/app/core/services/message.service.ts
import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly wsUrl = environment.apiUrl
    .replace(/^http/i, 'ws')
    .replace(/\/api\/?$/, '/ws');

  private readonly messagesSubject = new Subject<IMessage>();

  private readonly stompClient = new Client({
    brokerURL: this.wsUrl,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onStompError: (frame) => console.error('Erreur STOMP', frame.headers['message']),
    onWebSocketError: (event) => console.error('Erreur WebSocket', event)
  });

  connect(): void {
    if (!this.stompClient.active) {
      this.stompClient.activate();
    }
  }

  disconnect(): void {
    if (this.stompClient.active) {
      this.stompClient.deactivate();
    }
  }

  watch(destination: string): Observable<IMessage> {
    this.connect();
    this.stompClient.onConnect = () => {
      this.stompClient.subscribe(destination, (message) => this.messagesSubject.next(message));
    };
    return this.messagesSubject.asObservable();
  }

  publish(destination: string, body: unknown): void {
    this.connect();
    this.stompClient.publish({
      destination,
      body: JSON.stringify(body)
    });
  }
}
