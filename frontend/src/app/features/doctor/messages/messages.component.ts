// src/app/features/doctor/messages/messages.component.ts
import { Component, OnInit, inject, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
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
interface Message  { id: number; senderId: number; contenu: string; timestamp: string; }

@Component({
  selector: 'app-doctor-messages',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterModule, FormsModule, MatIconModule,
            MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'doctor'" [activeRoute]="'/doctor/messages'"></app-sidebar>

      <main class="main-content" style="flex:1;padding:0;">
        <div style="display:flex;height:100vh;">

          <!-- Liste des patients -->
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

          <!-- Zone de chat -->
          <div style="flex:1;display:flex;flex-direction:column;background:#F5F6FA;">

            <!-- Aucun contact sélectionné -->
            <div *ngIf="!selectedContact"
                 style="flex:1;display:flex;align-items:center;justify-content:center;
                        flex-direction:column;gap:12px;color:#7F8C8D;">
              <mat-icon style="font-size:64px;width:64px;height:64px;color:#BDC3C7;">chat</mat-icon>
              <p>Sélectionnez un patient</p>
            </div>

            <!-- Conversation -->
            <ng-container *ngIf="selectedContact">
              <!-- Header -->
              <div style="background:white;padding:14px 20px;border-bottom:1px solid #EEF0F4;
                          display:flex;align-items:center;gap:12px;">
                <div class="avatar" style="background:#0B5345;">
                  {{getInitials(selectedContact.nom, selectedContact.prenom)}}
                </div>
                <div style="font-weight:600;">
                  {{selectedContact.prenom}} {{selectedContact.nom}}
                </div>
              </div>

              <!-- Messages -->
              <div #msgContainer
                   style="flex:1;overflow-y:auto;padding:20px;
                          display:flex;flex-direction:column;gap:10px;">
                <div *ngIf="loadingMessages" style="text-align:center;padding:20px;">
                  <mat-progress-spinner mode="indeterminate" diameter="32"
                                        style="margin:0 auto;"></mat-progress-spinner>
                </div>
                <div *ngFor="let m of messages"
                     [style.align-items]="m.senderId === auth.userId ? 'flex-end' : 'flex-start'"
                     style="display:flex;flex-direction:column;">
                  <div [style.background]="m.senderId === auth.userId ? '#0B5345' : 'white'"
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
                          placeholder="Écrire un message..."
                          (keydown.enter)="send($event)"
                          style="flex:1;padding:10px 14px;border:1px solid #ddd;
                                 border-radius:20px;font-size:13px;resize:none;
                                 outline:none;font-family:inherit;">
                </textarea>
                <button mat-icon-button
                        (click)="send()"
                        [disabled]="!newMessage.trim() || sending"
                        style="background:#0B5345;color:white;border-radius:50%;
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
export class DoctorMessagesComponent implements OnInit, AfterViewChecked {
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

  send(event?: Event): void {
    if (event) event.preventDefault();
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

