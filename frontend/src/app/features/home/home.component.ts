// src/app/features/home/home.component.ts
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface StatCounter {
  label: string;
  target: number;
  value: number;
  suffix: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <!-- HEADER -->
    <header class="home-header">
      <div class="home-header__inner">
        <button type="button" class="home-logo" (click)="scrollToTop()" aria-label="Retour à l'accueil SteevaCare">
          <img src="assets/brand/steevacare-logo.png" alt="SteevaCare - Télémédecine pour l'Afrique">
        </button>

        <nav class="home-header-actions" aria-label="Navigation principale">
          <a href="#services">Services</a>
          <a href="#how-it-works">Comment ça marche</a>
          <a href="#testimonials">Témoignages</a>
          <button mat-stroked-button color="primary" type="button" (click)="goToLogin()">
            Se connecter
          </button>
          <button mat-raised-button color="primary" type="button" (click)="goToRegister()">
            Rejoindre
          </button>
        </nav>
      </div>
    </header>

    <!-- HERO -->
    <section class="home-hero" aria-labelledby="home-hero-title">
      <div class="home-hero__media" aria-hidden="true"></div>
      <div class="home-hero__overlay" aria-hidden="true"></div>
      <div class="home-hero__content">
        <div class="home-hero__badge">
          <mat-icon>verified_user</mat-icon>
          Plateforme de télémédecine sécurisée au Cameroun
        </div>

        <h1 id="home-hero-title" class="home-hero-title">
          Votre santé, notre priorité<br>
          <span>en Afrique centrale</span>
        </h1>

        <p class="home-hero-text" aria-live="polite">
          {{typedSubtitle}}<span class="typewriter-cursor" aria-hidden="true">|</span>
        </p>

        <div class="home-cta-row">
          <button mat-raised-button type="button" (click)="goToRegister()">
            <mat-icon>rocket_launch</mat-icon>
            Commencer maintenant
          </button>
          <button mat-stroked-button type="button" (click)="goToLogin()">
            <mat-icon>login</mat-icon>
            J'ai déjà un compte
          </button>
        </div>

        <div #statsSection class="hero-stats" aria-label="Indicateurs SteevaCare">
          <div class="hero-stat" *ngFor="let stat of stats; trackBy: trackByStat">
            <strong>{{stat.value | number:'1.0-0'}}{{stat.suffix}}</strong>
            <span>{{stat.label}}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SERVICES -->
    <section id="services" class="home-section home-section--soft">
      <div class="home-section__inner">
        <span class="section-kicker">Nos services</span>
        <h2>Tout ce dont vous avez besoin pour prendre soin de votre santé</h2>
        <p class="section-intro">
          Une expérience médicale complète : consultation, suivi, messagerie et ordonnances connectées.
        </p>

        <div class="home-services-grid">
          <mat-card *ngFor="let service of services; trackBy: trackByItem" class="service-card">
            <div class="service-card__icon" [style.background]="service.bg">
              <mat-icon [style.color]="service.color">{{service.icon}}</mat-icon>
            </div>
            <h3>{{service.title}}</h3>
            <p>{{service.description}}</p>
          </mat-card>
        </div>
      </div>
    </section>

    <!-- COMMENT CA MARCHE -->
    <section id="how-it-works" #howItWorksSection class="home-section how-section">
      <div class="home-section__inner">
        <span class="section-kicker">Comment ça marche</span>
        <h2>Votre parcours de soins en 4 étapes simples</h2>
        <p class="section-intro">
          De l'inscription à l'ordonnance, SteevaCare vous accompagne avec un flux clair, rapide et sécurisé.
        </p>

        <div class="timeline" [class.is-visible]="howItWorksVisible">
          <article
            class="timeline-step"
            *ngFor="let step of howItWorksSteps; let i = index; trackBy: trackByItem"
            [style.animation-delay.ms]="i * 150">
            <div class="timeline-step__marker">
              <mat-icon>{{step.icon}}</mat-icon>
              <span>{{i + 1}}</span>
            </div>
            <h3>{{step.title}}</h3>
            <p>{{step.text}}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- POURQUOI STEEVACARE -->
    <section class="home-section home-section--white">
      <div class="home-section__inner">
        <span class="section-kicker">Pourquoi SteevaCare ?</span>
        <h2>La plateforme de confiance pour votre santé</h2>
        <p class="section-intro">
          Une solution pensée pour les patients, médecins et pharmacies partenaires au Cameroun.
        </p>

        <div class="why-grid">
          <div *ngFor="let point of whyUs; trackBy: trackByItem" class="why-card">
            <div>{{point.emoji}}</div>
            <h3>{{point.title}}</h3>
            <p>{{point.text}}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- TEMOIGNAGES -->
    <section id="testimonials" class="home-section testimonials-section">
      <div class="home-section__inner">
        <span class="section-kicker">Témoignages</span>
        <h2>Ils font confiance à SteevaCare</h2>
        <p class="section-intro">
          Des patients camerounais partagent leur expérience avec notre service de télémédecine.
        </p>

        <div class="testimonials-carousel" aria-roledescription="carousel">
          <div class="testimonials-track" [style.transform]="'translateX(-' + (activeTestimonialIndex * 100) + '%)'">
            <mat-card class="testimonial-card" *ngFor="let testimonial of testimonials; trackBy: trackByItem">
              <div class="testimonial-card__header">
                <div class="testimonial-card__avatar" [style.background]="testimonial.color">
                  {{testimonial.initials}}
                </div>
                <div>
                  <h3>{{testimonial.name}}</h3>
                  <p>{{testimonial.city}}</p>
                </div>
              </div>
              <div class="testimonial-card__stars" aria-label="Note 5 sur 5">★★★★★</div>
              <p class="testimonial-card__text">“{{testimonial.text}}”</p>
            </mat-card>
          </div>
        </div>

        <div class="carousel-dots" aria-label="Contrôles du carousel témoignages">
          <button
            *ngFor="let testimonial of testimonials; let i = index; trackBy: trackByItem"
            type="button"
            [class.is-active]="i === activeTestimonialIndex"
            [attr.aria-label]="'Afficher le témoignage ' + (i + 1)"
            (click)="setActiveTestimonial(i)">
          </button>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="home-final-cta">
      <div>
        <h2>Prêt à prendre soin de votre santé ?</h2>
        <p>Rejoignez des milliers de patients qui font confiance à SteevaCare.</p>
        <button mat-raised-button type="button" (click)="goToRegister()">
          Créer mon compte gratuit
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="home-footer">
      <div class="home-footer__inner">
        <div class="home-footer__brand">
          <div class="home-footer__logo">
            <img src="assets/brand/steevacare-logo.png" alt="SteevaCare - Télémédecine pour l'Afrique">
          </div>
          <p>Votre santé connectée, partout au Cameroun.</p>
        </div>

        <nav class="home-footer__links" aria-label="Liens utiles">
          <a href="#">CGU</a>
          <a href="#">Politique de confidentialité</a>
          <a href="#">Contact</a>
          <a href="#">À propos</a>
        </nav>

        <div class="home-footer__socials" aria-label="Réseaux sociaux">
          <a href="#" aria-label="Facebook"><mat-icon>facebook</mat-icon></a>
          <a href="#" aria-label="Communauté"><mat-icon>groups</mat-icon></a>
          <a href="#" aria-label="Email"><mat-icon>mail</mat-icon></a>
        </div>
      </div>

      <div class="home-footer__copyright">
        © {{currentYear}} QuamTechs. Tous droits réservés.
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      color: #1F2D3D;
      background: #FFFFFF;
    }

    * {
      box-sizing: border-box;
    }

    .home-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(26,82,118,0.08);
      box-shadow: 0 8px 30px rgba(13,51,73,0.08);
      padding: 0 40px;
    }

    .home-header__inner {
      max-width: 1200px;
      min-height: 72px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .home-logo {
      border: 0;
      background: transparent;
      display: inline-flex;
      align-items: center;
      padding: 0;
      cursor: pointer;
    }

    .home-logo img {
      width: 168px;
      max-width: 44vw;
      height: auto;
      display: block;
    }

    .home-header-actions {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .home-header-actions a {
      color: #4D6475;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .home-header-actions a:hover {
      color: #1A5276;
    }

    .home-header-actions button[mat-raised-button] {
      border-radius: 999px;
      background: #1A5276;
      color: white;
      padding: 0 22px;
    }

    .home-header-actions button[mat-stroked-button] {
      border-radius: 999px;
    }

    .home-hero {
      min-height: calc(100vh - 72px);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 96px 40px 72px;
      color: white;
      isolation: isolate;
    }

    .home-hero__media {
      position: absolute;
      inset: 0;
      z-index: -3;
      background-image: url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1800&q=80');
      background-size: cover;
      background-position: center;
      transform: scale(1.04);
      animation: slowZoom 18s ease-in-out infinite alternate;
    }

    .home-hero__overlay {
      position: absolute;
      inset: 0;
      z-index: -2;
      background:
        radial-gradient(circle at 18% 24%, rgba(46,204,113,0.40), transparent 28%),
        linear-gradient(120deg, rgba(5,31,27,0.94) 0%, rgba(10,81,60,0.84) 46%, rgba(12,45,58,0.78) 100%);
    }

    .home-hero::after {
      content: '';
      position: absolute;
      inset: auto -10% -160px -10%;
      height: 260px;
      background: white;
      border-radius: 50% 50% 0 0;
      z-index: -1;
      opacity: 0.98;
    }

    .home-hero__content {
      width: min(100%, 980px);
      margin: 0 auto;
      text-align: center;
      animation: heroEnter 800ms ease both;
    }

    .home-hero__badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      margin-bottom: 24px;
      border: 1px solid rgba(255,255,255,0.24);
      border-radius: 999px;
      background: rgba(255,255,255,0.13);
      backdrop-filter: blur(14px);
      color: rgba(255,255,255,0.92);
      font-size: 14px;
      font-weight: 600;
    }

    .home-hero__badge mat-icon {
      color: #65F0A3;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .home-hero-title {
      font-size: clamp(2.7rem, 7vw, 5.8rem);
      font-weight: 900;
      line-height: 1.03;
      margin: 0 0 24px;
      letter-spacing: -2.5px;
      text-shadow: 0 20px 60px rgba(0,0,0,0.35);
    }

    .home-hero-title span {
      color: #8EF2B3;
    }

    .home-hero-text {
      min-height: 72px;
      max-width: 760px;
      margin: 0 auto 34px;
      color: rgba(255,255,255,0.90);
      font-size: clamp(1.05rem, 2vw, 1.35rem);
      line-height: 1.65;
      text-shadow: 0 10px 26px rgba(0,0,0,0.28);
    }

    .typewriter-cursor {
      display: inline-block;
      margin-left: 3px;
      color: #8EF2B3;
      animation: blink 800ms steps(2, start) infinite;
    }

    .home-cta-row {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 46px;
    }

    .home-cta-row button {
      min-height: 52px;
      border-radius: 14px;
      padding: 0 30px;
      font-size: 16px;
      font-weight: 800;
    }

    .home-cta-row button[mat-raised-button] {
      background: white;
      color: #145A42;
      box-shadow: 0 18px 40px rgba(0,0,0,0.22);
    }

    .home-cta-row button[mat-stroked-button] {
      border-color: rgba(255,255,255,0.55);
      color: white;
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(12px);
    }

    .home-cta-row mat-icon {
      margin-right: 8px;
      vertical-align: middle;
    }

    .hero-stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(150px, 1fr));
      gap: 18px;
      width: min(100%, 760px);
      margin: 0 auto;
    }

    .hero-stat {
      padding: 22px 16px;
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 22px;
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(16px);
      box-shadow: 0 18px 50px rgba(0,0,0,0.18);
    }

    .hero-stat strong {
      display: block;
      font-size: clamp(2rem, 4vw, 3.2rem);
      line-height: 1;
      color: #FFFFFF;
      margin-bottom: 8px;
    }

    .hero-stat span {
      color: rgba(255,255,255,0.78);
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .home-section {
      padding: 86px 40px;
    }

    .home-section--soft {
      background: #F5F8FA;
    }

    .home-section--white {
      background: white;
    }

    .home-section__inner {
      max-width: 1120px;
      margin: 0 auto;
    }

    .section-kicker {
      display: block;
      text-align: center;
      color: #27AE60;
      font-weight: 900;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }

    .home-section h2,
    .home-final-cta h2 {
      text-align: center;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 900;
      color: #113B52;
      margin: 0 0 12px;
      letter-spacing: -1px;
    }

    .section-intro {
      max-width: 680px;
      margin: 0 auto 48px;
      text-align: center;
      color: #6C7C89;
      font-size: 16px;
      line-height: 1.75;
    }

    .home-services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
    }

    .service-card,
    .testimonial-card {
      border-radius: 24px !important;
      border: 1px solid rgba(26,82,118,0.08);
      box-shadow: 0 14px 44px rgba(13,51,73,0.08) !important;
    }

    .service-card {
      padding: 30px;
      text-align: center;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .service-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 22px 58px rgba(13,51,73,0.14) !important;
    }

    .service-card__icon {
      width: 68px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px;
      border-radius: 20px;
    }

    .service-card__icon mat-icon {
      font-size: 34px;
      width: 34px;
      height: 34px;
    }

    .service-card h3,
    .why-card h3,
    .timeline-step h3,
    .testimonial-card h3 {
      color: #203545;
      font-weight: 800;
      margin: 0 0 10px;
    }

    .service-card p,
    .why-card p,
    .timeline-step p {
      color: #72818E;
      font-size: 14px;
      line-height: 1.7;
      margin: 0;
    }

    .how-section {
      background: linear-gradient(180deg,#FFFFFF 0%,#F1FBF5 100%);
    }

    .timeline {
      position: relative;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 22px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      top: 45px;
      left: 12%;
      right: 12%;
      height: 3px;
      background: linear-gradient(90deg,#1A5276,#27AE60);
      border-radius: 999px;
      opacity: 0.18;
    }

    .timeline-step {
      position: relative;
      z-index: 1;
      padding: 26px 22px;
      border-radius: 24px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(39,174,96,0.14);
      box-shadow: 0 16px 44px rgba(13,51,73,0.08);
      opacity: 0;
      transform: translateY(26px);
    }

    .timeline.is-visible .timeline-step {
      animation: fadeInUp 650ms ease forwards;
    }

    .timeline-step__marker {
      position: relative;
      width: 70px;
      height: 70px;
      margin: 0 auto 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 22px;
      color: white;
      background: linear-gradient(135deg,#1A5276,#27AE60);
      box-shadow: 0 14px 28px rgba(39,174,96,0.22);
    }

    .timeline-step__marker mat-icon {
      font-size: 34px;
      width: 34px;
      height: 34px;
    }

    .timeline-step__marker span {
      position: absolute;
      right: -8px;
      top: -8px;
      width: 26px;
      height: 26px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: white;
      color: #1A5276;
      font-size: 12px;
      font-weight: 900;
      box-shadow: 0 8px 16px rgba(13,51,73,0.14);
    }

    .timeline-step h3,
    .timeline-step p {
      text-align: center;
    }

    .why-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
    }

    .why-card {
      padding: 28px 20px;
      text-align: center;
      border-radius: 22px;
      background: #FFFFFF;
      border: 1px solid rgba(26,82,118,0.08);
      transition: transform 0.25s ease, background 0.25s ease;
    }

    .why-card:hover {
      transform: translateY(-5px);
      background: #F7FCFA;
    }

    .why-card div {
      font-size: 42px;
      margin-bottom: 14px;
    }

    .testimonials-section {
      background: linear-gradient(135deg,#EAF8F0 0%,#F7FAFC 100%);
      overflow: hidden;
    }

    .testimonials-carousel {
      max-width: 760px;
      margin: 0 auto;
      overflow: hidden;
      border-radius: 28px;
    }

    .testimonials-track {
      display: flex;
      transition: transform 500ms ease;
    }

    .testimonial-card {
      min-width: 100%;
      padding: 34px;
      background: rgba(255,255,255,0.95);
    }

    .testimonial-card__header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
    }

    .testimonial-card__avatar {
      width: 64px;
      height: 64px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 20px;
      color: white;
      font-size: 20px;
      font-weight: 900;
      box-shadow: 0 14px 30px rgba(13,51,73,0.14);
    }

    .testimonial-card h3 {
      font-size: 18px;
      margin-bottom: 4px;
    }

    .testimonial-card__header p {
      margin: 0;
      color: #7F8C8D;
      font-size: 13px;
      font-weight: 700;
    }

    .testimonial-card__stars {
      color: #F5B041;
      letter-spacing: 4px;
      margin-bottom: 16px;
      font-size: 18px;
    }

    .testimonial-card__text {
      margin: 0;
      color: #405365;
      font-size: 17px;
      line-height: 1.75;
    }

    .carousel-dots {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 22px;
    }

    .carousel-dots button {
      width: 11px;
      height: 11px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: rgba(26,82,118,0.24);
      cursor: pointer;
      transition: width 0.25s ease, background 0.25s ease;
    }

    .carousel-dots button.is-active {
      width: 34px;
      background: #27AE60;
    }

    .home-final-cta {
      padding: 78px 40px;
      color: white;
      text-align: center;
      background:
        radial-gradient(circle at 78% 20%, rgba(142,242,179,0.32), transparent 24%),
        linear-gradient(135deg,#0D3349,#1E8449);
    }

    .home-final-cta > div {
      max-width: 760px;
      margin: 0 auto;
    }

    .home-final-cta h2 {
      color: white;
    }

    .home-final-cta p {
      margin: 0 0 30px;
      color: rgba(255,255,255,0.84);
      font-size: 18px;
      line-height: 1.65;
    }

    .home-final-cta button {
      min-height: 54px;
      border-radius: 14px;
      padding: 0 34px;
      background: white;
      color: #145A42;
      font-weight: 900;
    }

    .home-final-cta mat-icon {
      margin-left: 8px;
    }

    .home-footer {
      background: #0D2533;
      color: rgba(255,255,255,0.76);
      padding: 46px 40px 24px;
    }

    .home-footer__inner {
      max-width: 1120px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1.2fr 1.4fr auto;
      align-items: center;
      gap: 32px;
    }

    .home-footer__logo {
      display: flex;
      align-items: center;
    }

    .home-footer__logo img {
      width: 210px;
      max-width: 100%;
      height: auto;
      display: block;
      padding: 10px 14px;
      border-radius: 18px;
      background: rgba(255,255,255,0.96);
      box-shadow: 0 16px 36px rgba(0,0,0,0.18);
    }

    .home-footer__brand p {
      margin: 12px 0 0;
      color: rgba(255,255,255,0.62);
      line-height: 1.6;
    }

    .home-footer__links {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 18px;
    }

    .home-footer__links a,
    .home-footer__socials a {
      color: rgba(255,255,255,0.74);
      text-decoration: none;
      transition: color 0.2s ease, transform 0.2s ease;
    }

    .home-footer__links a:hover,
    .home-footer__socials a:hover {
      color: #8EF2B3;
    }

    .home-footer__socials {
      display: flex;
      gap: 12px;
    }

    .home-footer__socials a {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: rgba(255,255,255,0.08);
    }

    .home-footer__socials a:hover {
      transform: translateY(-3px);
    }

    .home-footer__copyright {
      max-width: 1120px;
      margin: 34px auto 0;
      padding-top: 22px;
      border-top: 1px solid rgba(255,255,255,0.08);
      text-align: center;
      color: rgba(255,255,255,0.54);
      font-size: 13px;
    }

    @keyframes slowZoom {
      from { transform: scale(1.04); }
      to { transform: scale(1.12); }
    }

    @keyframes heroEnter {
      from { opacity: 0; transform: translateY(28px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes blink {
      0%, 45% { opacity: 1; }
      46%, 100% { opacity: 0; }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(26px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 960px) {
      .home-header {
        padding: 0 22px;
      }

      .home-header__inner {
        min-height: auto;
        padding: 16px 0;
        align-items: flex-start;
        flex-direction: column;
      }

      .home-header-actions {
        width: 100%;
        flex-wrap: wrap;
        gap: 12px;
      }

      .home-header-actions a {
        display: none;
      }

      .home-header-actions button {
        flex: 1 1 180px;
      }

      .home-footer__inner {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .home-footer__logo,
      .home-footer__socials {
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .home-hero,
      .home-section,
      .home-final-cta {
        padding-left: 20px;
        padding-right: 20px;
      }

      .home-hero {
        min-height: auto;
        padding-top: 72px;
        padding-bottom: 84px;
      }

      .home-hero-title {
        letter-spacing: -1.4px;
      }

      .home-hero-text {
        min-height: 112px;
      }

      .home-cta-row,
      .home-cta-row button {
        width: 100%;
      }

      .hero-stats {
        grid-template-columns: 1fr;
      }

      .timeline {
        grid-template-columns: 1fr;
        gap: 18px;
      }

      .timeline::before {
        top: 44px;
        bottom: 44px;
        left: 35px;
        right: auto;
        width: 3px;
        height: auto;
      }

      .timeline-step {
        display: grid;
        grid-template-columns: 74px 1fr;
        column-gap: 16px;
        text-align: left;
      }

      .timeline-step__marker {
        grid-row: span 2;
        margin: 0;
      }

      .timeline-step h3,
      .timeline-step p {
        text-align: left;
      }

      .testimonial-card {
        padding: 26px;
      }

      .testimonial-card__text {
        font-size: 15px;
      }
    }
  `]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  currentYear = new Date().getFullYear();

  @ViewChild('statsSection') private statsSection?: ElementRef<HTMLElement>;
  @ViewChild('howItWorksSection') private howItWorksSection?: ElementRef<HTMLElement>;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private statsObserver?: IntersectionObserver;
  private howItWorksObserver?: IntersectionObserver;
  private counterAnimationFrameId: number | null = null;
  private typewriterIntervalId: ReturnType<typeof setInterval> | null = null;
  private carouselIntervalId: ReturnType<typeof setInterval> | null = null;
  private hasAnimatedStats = false;

  readonly subtitle = 'Consultez un médecin qualifié depuis chez vous, obtenez vos ordonnances en ligne et accédez à des soins de qualité partout au Cameroun.';
  typedSubtitle = '';
  activeTestimonialIndex = 0;
  howItWorksVisible = false;

  stats: StatCounter[] = [
    { label: 'Médecins partenaires', target: 500, value: 0, suffix: '+' },
    { label: 'Patients accompagnés', target: 10000, value: 0, suffix: '+' },
    { label: 'Satisfaction patient', target: 98, value: 0, suffix: '%' }
  ];

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
    }
  ];

  howItWorksSteps = [
    {
      icon: 'person_add',
      title: 'Inscription',
      text: 'Créez votre compte sécurisé et renseignez vos informations essentielles en quelques minutes.'
    },
    {
      icon: 'manage_search',
      title: 'Recherche médecin',
      text: 'Trouvez un praticien certifié selon sa spécialité, sa disponibilité et votre besoin.'
    },
    {
      icon: 'video_call',
      title: 'Consultation',
      text: 'Échangez par vidéo ou messagerie sécurisée depuis votre téléphone ou ordinateur.'
    },
    {
      icon: 'receipt_long',
      title: 'Ordonnance',
      text: 'Recevez votre ordonnance numérique et partagez-la avec une pharmacie partenaire.'
    }
  ];

  whyUs = [
    { emoji: '🩺', title: 'Médecins certifiés',
      text: 'Tous nos médecins sont vérifiés et membres de l\'Ordre National des Médecins.' },
    { emoji: '⏰', title: 'Disponible 24h/24',
      text: 'Accédez à des soins médicaux à toute heure, même le week-end.' },
    { emoji: '🔒', title: 'Données protégées',
      text: 'Vos informations médicales sont chiffrées et ne sont jamais partagées.' },
    { emoji: '💰', title: 'Tarifs transparents',
      text: 'Connaissez le tarif avant la consultation, sans mauvaise surprise.' }
  ];

  testimonials = [
    {
      initials: 'AM',
      name: 'Ariane Mballa',
      city: 'Yaoundé, Cameroun',
      color: 'linear-gradient(135deg,#1A5276,#27AE60)',
      text: 'J\'ai pu consulter un médecin le soir sans quitter la maison. Le suivi était clair, rapide et rassurant.'
    },
    {
      initials: 'FN',
      name: 'Franck Njoya',
      city: 'Douala, Cameroun',
      color: 'linear-gradient(135deg,#6C3483,#1A5276)',
      text: 'La prise de rendez-vous est simple et mon ordonnance a été envoyée directement après la consultation.'
    },
    {
      initials: 'CB',
      name: 'Carine Biloa',
      city: 'Bafoussam, Cameroun',
      color: 'linear-gradient(135deg,#D35400,#27AE60)',
      text: 'SteevaCare m\'a évité un long déplacement. J\'ai apprécié la qualité de l\'écoute et la confidentialité.'
    }
  ];

  ngOnInit(): void {
    if (this.redirectAuthenticatedUser()) return;

    this.startTypewriter();
    this.startTestimonialsCarousel();
  }

  ngAfterViewInit(): void {
    this.observeStats();
    this.observeHowItWorks();
  }

  ngOnDestroy(): void {
    this.statsObserver?.disconnect();
    this.howItWorksObserver?.disconnect();

    if (this.counterAnimationFrameId !== null) {
      cancelAnimationFrame(this.counterAnimationFrameId);
    }

    if (this.typewriterIntervalId !== null) {
      clearInterval(this.typewriterIntervalId);
    }

    if (this.carouselIntervalId !== null) {
      clearInterval(this.carouselIntervalId);
    }
  }

  goToLogin(): void {
    if (this.redirectAuthenticatedUser()) return;
    this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    if (this.redirectAuthenticatedUser()) return;
    this.router.navigate(['/auth/register']);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setActiveTestimonial(index: number): void {
    this.activeTestimonialIndex = index;
    this.restartTestimonialsCarousel();
    this.cdr.markForCheck();
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item?.title ?? item?.name ?? item;
  }

  trackByStat(_: number, stat: StatCounter): string {
    return stat.label;
  }

  private redirectAuthenticatedUser(): boolean {
    const token = this.authService.token();
    const user = this.authService.currentUser();

    if (!user || !token) return false;

    if (this.authService.isTokenExpired(token)) {
      this.authService.logout(false);
      return false;
    }

    this.authService.redirectByRole(user.role);
    return true;
  }

  private startTypewriter(): void {
    let index = 0;
    this.typewriterIntervalId = setInterval(() => {
      this.typedSubtitle = this.subtitle.slice(0, index + 1);
      index++;

      if (index >= this.subtitle.length && this.typewriterIntervalId !== null) {
        clearInterval(this.typewriterIntervalId);
        this.typewriterIntervalId = null;
      }

      this.cdr.markForCheck();
    }, 32);
  }

  private observeStats(): void {
    const element = this.statsSection?.nativeElement;
    if (!element) return;

    this.statsObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.hasAnimatedStats) {
        this.hasAnimatedStats = true;
        this.animateStats();
        this.statsObserver?.disconnect();
      }
    }, { threshold: 0.35 });

    this.statsObserver.observe(element);
  }

  private animateStats(): void {
    const duration = 1700;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      this.stats = this.stats.map(stat => ({
        ...stat,
        value: Math.round(stat.target * eased)
      }));
      this.cdr.markForCheck();

      if (progress < 1) {
        this.counterAnimationFrameId = requestAnimationFrame(tick);
      } else {
        this.counterAnimationFrameId = null;
      }
    };

    this.counterAnimationFrameId = requestAnimationFrame(tick);
  }

  private observeHowItWorks(): void {
    const element = this.howItWorksSection?.nativeElement;
    if (!element) return;

    this.howItWorksObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.howItWorksVisible = true;
        this.cdr.markForCheck();
        this.howItWorksObserver?.disconnect();
      }
    }, { threshold: 0.25 });

    this.howItWorksObserver.observe(element);
  }

  private startTestimonialsCarousel(): void {
    this.carouselIntervalId = setInterval(() => {
      this.activeTestimonialIndex = (this.activeTestimonialIndex + 1) % this.testimonials.length;
      this.cdr.markForCheck();
    }, 4000);
  }

  private restartTestimonialsCarousel(): void {
    if (this.carouselIntervalId !== null) {
      clearInterval(this.carouselIntervalId);
    }

    this.startTestimonialsCarousel();
  }
}
