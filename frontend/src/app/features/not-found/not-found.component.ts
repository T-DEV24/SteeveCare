// src/app/features/not-found/not-found.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
                background:linear-gradient(135deg,#1A5276,#27AE60);flex-direction:column;
                text-align:center;color:white;padding:32px;">
      <div style="font-size:96px;margin-bottom:16px;">🏥</div>
      <h1 style="font-size:80px;font-weight:700;margin:0;opacity:0.9;">404</h1>
      <h2 style="font-size:24px;font-weight:400;margin:8px 0 24px;opacity:0.85;">
        Page introuvable
      </h2>
      <p style="font-size:15px;opacity:0.7;max-width:360px;line-height:1.6;margin-bottom:32px;">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        <button mat-raised-button routerLink="/home"
                style="background:white;color:#1A5276;font-weight:600;
                       border-radius:10px;padding:10px 24px;">
          <mat-icon>home</mat-icon> Accueil
        </button>
        <button mat-stroked-button routerLink="/auth/login"
                style="border-color:rgba(255,255,255,0.6);color:white;
                       border-radius:10px;padding:10px 24px;">
          <mat-icon>login</mat-icon> Se connecter
        </button>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
