// src/app/features/doctor/messages/messages.component.ts
import { Component, OnDestroy, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

interface Contact { id: number; nom: string; prenom: string; }
interface Message { id: number; senderId: number; contenu: string; timestamp: string; }

@Component({
  selector: 'app-doctor-messages',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterModule, FormsModule, MatIconModule,
            MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'doctor'"
                   [activeRoute]="'/doctor/messages'"
                   [badgeCounts]="sidebarBadges"></app-sidebar>

      <main class="main-content" style="flex:1;padding:0;">
        <div style="display:flex;height:100vh;">
          <div style="width:300px;border-right:1px solid #EEF0F4;background:white;
                      display:flex;flex-direction:column;flex-shrink:0;">
            <div style="padding:20px 16px;border-bottom:1px solid #EEF0F4;">
              <h2 style="font-size:16px;font-weight:600;color:#0B5345;">💬 Messagerie</h2>
            </div>
            <div style="flex:1;overflow-y:auto;">
              <div *ngFor="let c of contacts"
                   (click)="selectContact(c)"
                   [style.background]="selectedContact?.id === c.id ? '#E8F5E9' : 'white'"
                   style="padding:14px 16px;cursor:pointer;border-bottom:1px solid #F5F6FA;
                          display:flex;align-items:center;gap:12px;transition:background 0.15s;">
                <div class="avatar" style="background:#0B5345;flex-shrink:0;">
                  {{getInitials(c.nom, c.prenom)}}
                </div>
                <div>
                  <div style="font-weight:500;font-size:14px;">{{c.prenom}} {{c.nom}}</div>
                  <div style="font-size:11px;color:#7F8C8D;">Patient</div>
                </div>
              </div>
              <div *ngIf="contacts.length === 0"
                   style="padding:24px;text-align:center;color:#7F8C8D;font-size:13px;">
                Aucun patient à contacter.<br>
                <small>Les patients avec des RDV confirmés apparaîtront ici.</small>
              </div>
            </div>
          </div>

          <div style="flex:1;display:flex;flex-direction:column;background:#F5F6FA;">
            <div *ngIf="!selectedContact"
                 style="flex:1;display:flex;align-items:center;justify-content:center;
                        flex-direction:column;gap:12px;color:#7F8C8D;">
              <mat-icon style="font-size:64px;width:64px;height:64px;color:#BDC3C7;">chat</mat-icon>
              <p>Sélectionnez un patient</p>
            </div>

            <ng-container *ngIf="selectedContact">
              <div style="background:white;padding:14px 20px;border-bottom:1px solid #EEF0F4;
                          display:flex;align-items:center;gap:12px;">
                <div class="avatar" style="background:#0B5345;">
                  {{getInitials(selectedContact.nom, selectedContact.prenom)}}
                </div>
                <div style="font-weight:600;">
                  {{selectedContact.prenom}} {{selectedContact.nom}}
                </div>
              </div>

              <div #msgContainer
                   (scroll)="onMessagesScroll()"
                   style="flex:1;overflow-y:auto;padding:20px;
                          display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;">
                <div *ngIf="loadingMessages" style="text-align:center;padding:20px;">
                  <mat-progress-spinner mode="indeterminate" diameter="32"
                                        style="margin:0 auto;"></mat-progress-spinner>
                </div>
                <div *ngFor="let m of messages; trackBy: trackMessage"
                     class="message-item fade-in-up"
                     [style.align-items]="m.senderId === auth.userId ? 'flex-end' : 'flex-start'"
                     style="display:flex;flex-direction:column;">
                  <div [style.background]="m.senderId === auth.userId ? '#0B5345' : 'white'"
                       [style.color]="m.senderId === auth.userId ? 'white' : '#2C3E50'"
                       style="max-width:70%;padding:10px 14px;border-radius:12px;
                              font-size:13px;line-height:1.5;white-space:pre-wrap;
                              box-shadow:0 1px 4px rgba(0,0,0,0.08);">
                    {{m.contenu}}
                  </div>
                  <span style="font-size:10px;color:#BDC3C7;margin-top:3px;">
                    {{formatTime(m.timestamp)}}
                  </span>
                </div>
                <div *ngIf="showTypingIndicator"
                     style="display:flex;align-items:center;gap:8px;color:#7F8C8D;font-size:12px;padding:4px 2px;">
                  <span>En train d'écrire</span>
                  <span class="typing-dots"><span></span><span></span><span></span></span>
                </div>
                <div *ngIf="!loadingMessages && messages.length === 0"
                     style="text-align:center;color:#7F8C8D;font-size:13px;padding:20px;">
                  Commencez la conversation
                </div>
              </div>

              <div style="background:white;padding:12px 16px;border-top:1px solid #EEF0F4;">
                <div style="display:flex;gap:10px;align-items:flex-end;">
                  <textarea [(ngModel)]="newMessage"
                            maxlength="500"
                            rows="1"
                            placeholder="Écrire un message..."
                            (keydown.enter)="handleEnter($event)"
                            style="flex:1;padding:10px 14px;border:1px solid #ddd;
                                   border-radius:20px;font-size:13px;resize:vertical;
                                   outline:none;font-family:inherit;max-height:120px;min-height:40px;">
                  </textarea>
                  <button mat-icon-button
                          (click)="send()"
                          [disabled]="!newMessage.trim() || sending || newMessage.length > 500"
                          style="background:#0B5345;color:white;border-radius:50%;
                                 width:40px;height:40px;flex-shrink:0;">
                    <mat-icon style="font-size:20px;">send</mat-icon>
                  </button>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
                  <span style="font-size:11px;color:#7F8C8D;">Entrée pour envoyer · Shift+Entrée pour une nouvelle ligne</span>
                  <span [style.color]="newMessage.length > 500 ? '#E74C3C' : '#7F8C8D'" style="font-size:11px;">
                    {{newMessage.length}}/500
                  </span>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in-up { animation: fadeInUp 0.22s ease-out both; }
    .typing-dots { display:inline-flex; gap:3px; align-items:center; }
    .typing-dots span { width:5px; height:5px; border-radius:50%; background:#7F8C8D; animation: typingPulse 1s infinite ease-in-out; }
    .typing-dots span:nth-child(2) { animation-delay: .15s; }
    .typing-dots span:nth-child(3) { animation-delay: .3s; }
    @keyframes typingPulse { 0%, 80%, 100% { opacity:.3; transform:translateY(0); } 40% { opacity:1; transform:translateY(-3px); } }
  `]
})
export class DoctorMessagesComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private api = inject(ApiService);

  @ViewChild('msgContainer') msgContainer!: ElementRef<HTMLDivElement>;

  contacts: Contact[] = [];
  selectedContact: Contact | null = null;
  messages: Message[] = [];
  newMessage = '';
  loadingMessages = false;
  sending = false;
  unreadCount = 0;
  private messagePollingId: ReturnType<typeof setInterval> | null = null;
  private unreadPollingId: ReturnType<typeof setInterval> | null = null;
  private userWasAtBottom = true;

  get sidebarBadges(): Record<string, number> {
    return { '/doctor/messages': this.unreadCount };
  }

  get showTypingIndicator(): boolean {
    return this.newMessage.trim().length > 0 && !this.sending;
  }

  ngOnInit(): void {
    this.loadContacts();
    this.loadUnreadCount();
    this.messagePollingId = setInterval(() => this.refreshMessages(), 5000);
    this.unreadPollingId = setInterval(() => this.loadUnreadCount(), 5000);
  }

  ngOnDestroy(): void {
    if (this.messagePollingId) clearInterval(this.messagePollingId);
    if (this.unreadPollingId) clearInterval(this.unreadPollingId);
  }

  loadContacts(): void {
    this.api.get<any[]>('/api/appointments/doctor/me').subscribe({
      next: (rdvs) => {
        const seen = new Set<number>();
        this.contacts = rdvs
          .filter(r => r.statut === 'CONFIRMED' || r.statut === 'COMPLETED')
          .reduce((acc: Contact[], r) => {
            if (!seen.has(r.patientId)) {
              seen.add(r.patientId);
              acc.push({ id: r.patientId, nom: r.patientNom, prenom: r.patientPrenom });
            }
            return acc;
          }, []);
      },
      error: () => {}
    });
  }

  loadUnreadCount(): void {
    this.api.get<number | { count: number }>('/api/messages/unread-count').subscribe({
      next: (res) => { this.unreadCount = typeof res === 'number' ? res : (res?.count ?? 0); },
      error: () => { this.unreadCount = 0; }
    });
  }

  selectContact(c: Contact): void {
    this.selectedContact = c;
    this.loadingMessages = true;
    this.messages = [];
    this.refreshMessages(true);
  }

  refreshMessages(forceScroll = false): void {
    if (!this.selectedContact) return;
    const shouldKeepBottom = forceScroll || this.isAtBottom();
    this.api.get<Message[]>(`/api/messages/${this.selectedContact.id}`).subscribe({
      next: (msgs) => {
        const hadNewMessage = msgs.length !== this.messages.length || msgs.some((m, i) => m.id !== this.messages[i]?.id);
        this.messages = msgs;
        this.loadingMessages = false;
        if ((shouldKeepBottom || this.userWasAtBottom) && hadNewMessage) this.scrollToBottom();
      },
      error: () => { this.loadingMessages = false; }
    });
  }

  onMessagesScroll(): void {
    this.userWasAtBottom = this.isAtBottom();
  }

  handleEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) return;
    event.preventDefault();
    this.send();
  }

  send(): void {
    if (!this.newMessage.trim() || !this.selectedContact || this.sending || this.newMessage.length > 500) return;
    const contenu = this.newMessage.trim();
    this.newMessage = '';
    this.sending = true;
    const shouldKeepBottom = this.isAtBottom();
    this.api.post<Message>(`/api/messages/${this.selectedContact.id}`, { contenu }).subscribe({
      next: (m) => {
        if (!this.messages.some(existing => existing.id === m.id)) this.messages.push(m);
        if (shouldKeepBottom || m.senderId === this.auth.userId) this.scrollToBottom();
        this.sending = false;
        this.loadUnreadCount();
      },
      error: () => { this.sending = false; }
    });
  }

  private isAtBottom(): boolean {
    const el = this.msgContainer?.nativeElement;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.msgContainer?.nativeElement;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 0);
  }

  trackMessage(_: number, message: Message): number {
    return message.id;
  }

  getInitials(nom: string, prenom: string): string {
    return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
  }

  formatTime(t: string): string {
    if (!t) return '';
    return new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
