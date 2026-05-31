// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SplashScreenComponent],
  template: `
    <!-- Splash screen — visible au premier chargement -->
    <app-splash-screen
      *ngIf="showSplash"
      (splashDone)="onSplashDone()">
    </app-splash-screen>

    <!-- Application principale -->
    <div *ngIf="!showSplash"
         style="animation: appFadeIn 0.4s ease-out;">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    @keyframes appFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AppComponent implements OnInit {
  showSplash = true;

  ngOnInit(): void {
    // Afficher le splash uniquement au premier chargement de la session
    const alreadyLoaded = sessionStorage.getItem('sc_loaded');
    if (alreadyLoaded) {
      this.showSplash = false;
    }
  }

  onSplashDone(): void {
    this.showSplash = false;
    sessionStorage.setItem('sc_loaded', '1');
  }
}
