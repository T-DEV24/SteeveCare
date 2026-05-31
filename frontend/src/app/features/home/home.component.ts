// src/app/features/home/home.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <!-- HEADER -->
    <header class="home-header" style="background:white;box-shadow:0 2px 8px rgba(0,0,0,0.08);
                   position:sticky;top:0;z-index:50;padding:0 40px;">
      <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;
                  justify-content:space-between;height:64px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:28px;">💊</span>
          <span style="font-size:20px;font-weight:700;color:#1A5276;letter-spacing:0.5px;">
            SteevaCare
          </span>
        </div>
        <nav class="home-header-actions" style="display:flex;gap:12px;align-items:center;">
          <button mat-stroked-button color="primary" routerLink="/auth/login"
                  style="border-radius:8px;">
            Se connecter
          </button>
          <button mat-raised-button color="primary" routerLink="/auth/register"
                  style="border-radius:8px;background:#1A5276;">
            S'inscrire gratuitement
          </button>
        </nav>
      </div>
    </header>

    <!-- HERO -->
    <section class="home-hero" style="background:linear-gradient(135deg,#1A5276 0%,#27AE60 100%);
                    padding:80px 40px;text-align:center;color:white;">
      <div style="max-width:700px;margin:0 auto;">
        <div class="home-hero-icon" style="font-size:56px;margin-bottom:16px;">🏥</div>
        <h1 class="home-hero-title" style="font-weight:700;margin-bottom:16px;line-height:1.2;">
          Votre santé, notre priorité<br>en Afrique centrale
        </h1>
        <p class="home-hero-text" style="opacity:0.9;margin-bottom:32px;line-height:1.7;">
          Consultez un médecin qualifié depuis chez vous, obtenez vos ordonnances
          en ligne et accédez à des soins de qualité partout au Cameroun.
        </p>
        <div class="home-cta-row" style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
          <button mat-raised-button routerLink="/auth/register"
                  style="background:white;color:#1A5276;font-weight:600;
                         padding:12px 32px;font-size:16px;border-radius:10px;">
            <mat-icon style="margin-right:8px;">rocket_launch</mat-icon>
            Commencer maintenant
          </button>
          <button mat-stroked-button routerLink="/auth/login"
                  style="border-color:rgba(255,255,255,0.6);color:white;
                         padding:12px 28px;font-size:16px;border-radius:10px;">
            J'ai déjà un compte
          </button>
        </div>
      </div>
    </section>

    <!-- SERVICES -->
    <section class="home-section" style="padding:64px 40px;background:#F5F6FA;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="text-align:center;font-size:28px;font-weight:700;
                   color:#1A5276;margin-bottom:8px;">Nos services</h2>
        <p style="text-align:center;color:#7F8C8D;margin-bottom:48px;font-size:15px;">
          Tout ce dont vous avez besoin pour prendre soin de votre santé
        </p>
        <div class="home-services-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;">
          <mat-card *ngFor="let service of services"
                    style="padding:28px;text-align:center;cursor:default;
                           transition:transform 0.2s,box-shadow 0.2s;"
                    onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 30px rgba(0,0,0,0.12)'"
                    onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow=''">
            <div [style.background]="service.bg"
                 style="width:64px;height:64px;border-radius:16px;
                        display:flex;align-items:center;justify-content:center;
                        margin:0 auto 16px;">
              <mat-icon [style.color]="service.color" style="font-size:32px;width:32px;height:32px;">
                {{service.icon}}
              </mat-icon>
            </div>
            <h3 style="font-size:17px;font-weight:600;margin-bottom:10px;color:#2C3E50;">
              {{service.title}}
            </h3>
            <p style="color:#7F8C8D;font-size:13px;line-height:1.6;">{{service.description}}</p>
          </mat-card>
        </div>
      </div>
    </section>

    <!-- POURQUOI STEEVACARE -->
    <section class="home-section" style="padding:64px 40px;background:white;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="text-align:center;font-size:28px;font-weight:700;
                   color:#1A5276;margin-bottom:8px;">Pourquoi SteevaCare ?</h2>
        <p style="text-align:center;color:#7F8C8D;margin-bottom:48px;font-size:15px;">
          La plateforme de confiance pour votre santé
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;">
          <div *ngFor="let point of whyUs" style="text-align:center;padding:24px 16px;">
            <div style="font-size:40px;margin-bottom:12px;">{{point.emoji}}</div>
            <h3 style="font-size:15px;font-weight:600;margin-bottom:8px;color:#2C3E50;">
              {{point.title}}
            </h3>
            <p style="color:#7F8C8D;font-size:13px;line-height:1.6;">{{point.text}}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="home-final-cta" style="background:linear-gradient(135deg,#1A5276,#27AE60);
                    padding:64px 40px;text-align:center;color:white;">
      <h2 class="home-final-title" style="font-size:30px;font-weight:700;margin-bottom:12px;">
        Prêt à prendre soin de votre santé ?
      </h2>
      <p style="font-size:16px;opacity:0.9;margin-bottom:32px;">
        Rejoignez des milliers de patients qui font confiance à SteevaCare
      </p>
      <button mat-raised-button routerLink="/auth/register"
              style="background:white;color:#1A5276;font-weight:700;
                     padding:14px 40px;font-size:16px;border-radius:10px;">
        Créer mon compte gratuit
      </button>
    </section>

    <!-- FOOTER -->
    <footer style="background:#1A3A4A;color:rgba(255,255,255,0.7);
                   text-align:center;padding:24px;font-size:13px;">
      <p>© 2024 SteevaCare by <strong style="color:white;">QuamTechs</strong>
         — Yaoundé, Cameroun &nbsp;|&nbsp;
         Plateforme de télémédecine pour l'Afrique centrale</p>
    </footer>
  `,
  styles: [`
    :host { display: block; }
    mat-card { border-radius: 12px !important; }
    .home-hero-title { font-size: clamp(2rem, 5vw, 3.5rem); }
    .home-hero-text { font-size: clamp(1rem, 2vw, 1.15rem); }
    .home-hero-icon { font-size: clamp(3rem, 8vw, 4rem) !important; }

    @media (max-width: 768px) {
      .home-header { padding: 0 16px !important; }
      .home-header > div { height: auto !important; min-height: 64px; gap: 12px; align-items: flex-start !important; flex-direction: column; padding: 14px 0; }
      .home-header-actions { width: 100%; flex-direction: column; align-items: stretch !important; }
      .home-header-actions button { width: 100%; }
      .home-hero, .home-section, .home-final-cta { padding: 48px 20px !important; }
      .home-cta-row { flex-direction: column; align-items: stretch; }
      .home-cta-row button { width: 100%; }
      .home-services-grid { grid-template-columns: 1fr !important; }
    }
  `]
})
export class HomeComponent {
  services = [
    {
      icon: 'videocam', title: 'Téléconsultation Vidéo',
      description: 'Consultez un médecin en face à face par vidéo, sans vous déplacer.',
      color: '#1A5276', bg: '#D6EAF8'
    },
    {
      icon: 'chat', title: 'Messagerie Médicale Sécurisée',
      description: 'Échangez avec votre médecin par messagerie chiffrée à tout moment.',
      color: '#27AE60', bg: '#D5F5E3'
    },
    {
      icon: 'local_pharmacy', title: 'Pharmacies Partenaires',
      description: 'Recevez vos ordonnances directement dans les pharmacies du réseau.',
      color: '#8E44AD', bg: '#E8DAEF'
    },
    {
      icon: 'folder_shared', title: 'Dossier Médical Numérique',
      description: 'Centralisez votre historique médical, analyses et ordonnances.',
      color: '#F39C12', bg: '#FDEBD0'
    },
    {
      icon: 'schedule', title: 'Rendez-vous Flexibles',
      description: 'Planifiez vos consultations en ligne, 7j/7 selon vos disponibilités.',
      color: '#E74C3C', bg: '#FADBD8'
    },
    {
      icon: 'security', title: 'Données 100% Sécurisées',
      description: 'Vos données médicales sont protégées et confidentielles.',
      color: '#2980B9', bg: '#D6EAF8'
    },
  ];

  whyUs = [
    { emoji: '🩺', title: 'Médecins certifiés',
      text: 'Tous nos médecins sont vérifiés et membres de l\'Ordre National des Médecins.' },
    { emoji: '⏰', title: 'Disponible 24h/24',
      text: 'Accédez à des soins médicaux à toute heure, même le week-end.' },
    { emoji: '🔒', title: 'Données protégées',
      text: 'Vos informations médicales sont chiffrées et ne sont jamais partagées.' },
    { emoji: '💰', title: 'Tarifs transparents',
      text: 'Connaissez le tarif avant la consultation, sans mauvaise surprise.' },
  ];
}
