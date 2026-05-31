// src/app/features/patient/messages/messages.component.ts
import { Component, OnInit, inject, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface Contact { id: number; nom: string; prenom: string; specialite?: string; }
interface Message  { id: number; senderId: number; contenu: string; timestamp: string; isRead: boolean; }

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule,
            MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <aside class="sidebar" style="background:#1A5276;">
        <div class="sidebar-logo">
          <span class="logo-icon">ðŸ’Š</span> SteevaCare
        </div>
        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/patient/dashboard">
            <mat-icon>home</mat-icon> Accueil
          </a>
          <a class="nav-item" routerLink="/patient/doctors">
            <mat-icon>search</mat-icon> Trouver un mÃ©decin
          </a>
          <a class="nav-item" routerLink="/patient/appointments">
            <mat-icon>event</mat-icon> Mes rendez-vous
          </a>
          <a class="nav-item" routerLink="/patient/medical-record">
            <mat-icon>folder_shared</mat-icon> Dossier mÃ©dical
          </a>
          <a class="nav-item active" routerLink="/patient/messages">
            <mat-icon>chat</mat-icon> Messagerie
          </a>
        </nav>
        <div class="sidebar-footer">
          <a class="nav-item" (click)="auth.logout()" style="cursor:pointer;">
            <mat-icon>logout</mat-icon> DÃ©connexion
          </a>
        </div>
      </aside>

      <main class="main-content" style="flex:1;padding:0;">
        <div style="display:flex;height:100vh;">

          <!-- Liste des contacts -->
          <div style="width:300px;border-right:1px solid #EEF0F4;background:white;
                      display:flex;flex-direction:column;flex-shrink:0;">
            <div style="padding:20px 16px;border-bottom:1px solid #EEF0F4;">
              <h2 style="font-size:16px;font-weight:600;color:#1A5276;">ðŸ’¬ Messagerie</h2>
            </div>
            <div style="flex:1;overflow-y:auto;">
              <div *ngFor="let c of contacts"
                   (click)="selectContact(c)"
                   [style.background]="selectedContact?.id === c.id ? '#EBF5FB' : 'white'"
                   style="padding:14px 16px;cursor:pointer;border-bottom:1px solid #F5F6FA;
                          display:flex;align-items:center;gap:12px;transition:background 0.15s;">
                <div class="avatar" style="background:#1A5276;flex-shrink:0;">
                  {{getInitials(c.nom, c.prenom)}}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:500;font-size:14px;color:#2C3E50;">
                    Dr. {{c.prenom}} {{c.nom}}
                  </div>
                  <div *ngIf="c.specialite"
                       style="font-size:11px;color:#7F8C8D;">{{c.specialite}}</div>
                </div>
              </div>
              <div *ngIf="contacts.length === 0"
                   style="padding:24px;text-align:center;color:#7F8C8D;font-size:13px;">
                Aucun mÃ©decin contactÃ©.<br>
                <small>Prenez un rendez-vous pour dÃ©marrer une conversation.</small>
              </div>
            </div>
          </div>

          <!-- Zone de chat -->
          <div style="flex:1;display:flex;flex-direction:column;background:#F5F6FA;">

            <!-- Aucun contact sÃ©lectionnÃ© -->
            <div *ngIf="!selectedContact"
                 style="flex:1;display:flex;align-items:center;justify-content:center;
                        flex-direction:column;gap:12px;color:#7F8C8D;">
              <mat-icon style="font-size:64px;width:64px;height:64px;color:#BDC3C7;">chat</mat-icon>
              <p style="font-size:15px;">SÃ©lectionnez un mÃ©decin pour commencer</p>
            </div>

            <!-- Conversation -->
            <ng-container *ngIf="selectedContact">
              <!-- Header -->
              <div style="background:white;padding:14px 20px;border-bottom:1px solid #EEF0F4;
                          display:flex;align-items:center;gap:12px;">
                <div class="avatar" style="background:#1A5276;">
                  {{getInitials(selectedContact.nom, selectedContact.prenom)}}
                </div>
                <div>
                  <div style="font-weight:600;">
                    Dr. {{selectedContact.prenom}} {{selectedContact.nom}}
                  </div>
                  <div style="font-size:12px;color:#7F8C8D;">{{selectedContact.specialite}}</div>
                </div>
              </div>

              <!-- Messages -->
              <div #msgContainer
                   style="flex:1;overflow-y:auto;padding:20px;
                          display:flex;flex-direction:column;gap:10px;">
                <div *ngIf="loadingMessages"
                     style="text-align:center;padding:20px;">
                  <mat-progress-spinner mode="indeterminate" diameter="32"
                                        style="margin:0 auto;"></mat-progress-spinner>
                </div>
                <div *ngFor="let m of messages"
                     [style.align-items]="m.senderId === auth.userId ? 'flex-end' : 'flex-start'"
                     style="display:flex;flex-direction:column;">
                  <div [style.background]="m.senderId === auth.userId ? '#1A5276' : 'white'"
                       [style.color]="m.senderId === auth.userId ? 'white' : '#2C3E50'"
                       style="max-width:70%;padding:10px 14px;border-radius:12px;
                              font-size:13px;line-height:1.5;
                              box-shadow:0 1px 4px rgba(0,0,0,0.08);">
                    {{m.contenu}}
                  </div>
                  <span style="font-size:10px;color:#BDC3C7;margin-top:3px;">
                    {{formatTime(m.timestamp)}}
                  </span>
                </div>
                <div *ngIf="!loadingMessages && messages.length === 0"
                     style="text-align:center;color:#7F8C8D;font-size:13px;padding:20px;">
                  Commencez la conversation
                </div>
              </div>

              <!-- Zone de saisie -->
              <div style="background:white;padding:12px 16px;border-top:1px solid #EEF0F4;
                          display:flex;gap:10px;align-items:flex-end;">
                <textarea [(ngModel)]="newMessage"
                          rows="1"
                          placeholder="Ã‰crire un message..."
                          (keydown.enter)="sendMessage($event)"
                          style="flex:1;padding:10px 14px;border:1px solid #ddd;
                                 border-radius:20px;font-size:13px;resize:none;
                                 outline:none;font-family:inherit;max-height:100px;">
                </textarea>
                <button mat-icon-button
                        (click)="sendMessage()"
                        [disabled]="!newMessage.trim() || sending"
                        style="background:#1A5276;color:white;border-radius:50%;
                               width:40px;height:40px;flex-shrink:0;">
                  <mat-icon style="font-size:20px;">send</mat-icon>
                </button>
              </div>
            </ng-container>
          </div>
        </div>
      </main>
    </div>
  `
})
export class MessagesComponent implements OnInit, AfterViewChecked {
  auth    = inject(AuthService);
  private api = inject(ApiService);

  @ViewChild('msgContainer') msgContainer!: ElementRef;

  contacts: Contact[]  = [];
  selectedContact: Contact | null = null;
  messages: Message[]  = [];
  newMessage           = '';
  loadingMessages      = false;
  sending              = false;
  private shouldScroll = false;

  ngOnInit(): void {
    this.api.get<any[]>('/api/appointments/patient/me').subscribe({
      next: (rdvs) => {
        const seen = new Set<number>();
        this.contacts = rdvs
          .filter(r => r.statut === 'CONFIRMED' || r.statut === 'COMPLETED')
          .reduce((acc: Contact[], r) => {
            if (!seen.has(r.doctorId)) {
              seen.add(r.doctorId);
              acc.push({
                id: r.doctorId,
                nom: r.doctorNom,
                prenom: r.doctorPrenom,
                specialite: r.doctorSpecialite
              });
            }
            return acc;
          }, []);
      },
      error: () => {}
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.msgContainer) {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  selectContact(c: Contact): void {
    this.selectedContact = c;
    this.loadingMessages = true;
    this.messages = [];
    this.api.get<Message[]>(`/api/messages/${c.id}`).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.loadingMessages = false;
        this.shouldScroll = true;
      },
      error: () => { this.loadingMessages = false; }
    });
  }

  sendMessage(event?: Event): void {
    if (event) { event.preventDefault(); }
    if (!this.newMessage.trim() || !this.selectedContact || this.sending) return;
    const contenu = this.newMessage.trim();
    this.newMessage = '';
    this.sending = true;
    this.api.post<Message>(`/api/messages/${this.selectedContact.id}`, { contenu }).subscribe({
      next: (m) => {
        this.messages.push(m);
        this.shouldScroll = true;
        this.sending = false;
      },
      error: () => { this.sending = false; }
    });
  }

  getInitials(nom: string, prenom: string): string {
    return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
  }

  formatTime(t: string): string {
    if (!t) return '';
    return new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}

