// src/app/app.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatProgressSpinnerModule, SplashScreenComponent],
  template: `
    <app-splash-screen
      *ngIf="showSplash"
      (splashDone)="onSplashDone()">
    </app-splash-screen>

    <div *ngIf="!showSplash"
         style="animation: appFadeIn 0.4s ease-out;">
      <router-outlet></router-outlet>
    </div>

    <div *ngIf="loadingService.loading$ | async"
         class="global-loading-overlay"
         role="status"
         aria-live="polite"
         aria-label="Chargement en cours">
      <mat-progress-spinner mode="indeterminate" diameter="56"></mat-progress-spinner>
      <span class="sr-only">Chargement en cours</span>
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
  protected loadingService = inject(LoadingService);
  showSplash = true;

  ngOnInit(): void {
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
