// src/app/shared/components/splash-screen/splash-screen.component.ts
import { Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeOut', [
      state('visible', style({ opacity: 1 })),
      state('hidden',  style({ opacity: 0, pointerEvents: 'none' })),
      transition('visible => hidden', animate('600ms ease-out'))
    ]),
    trigger('logoAnim', [
      transition(':enter', [
        animate('800ms ease-out', keyframes([
          style({ opacity: 0, transform: 'scale(0.4) translateY(30px)', offset: 0 }),
          style({ opacity: 1, transform: 'scale(1.08) translateY(-6px)', offset: 0.7 }),
          style({ opacity: 1, transform: 'scale(1) translateY(0)',       offset: 1 })
        ]))
      ])
    ]),
    trigger('textAnim', [
      transition(':enter', [
        animate('700ms 300ms ease-out', keyframes([
          style({ opacity: 0, transform: 'translateY(20px)', offset: 0 }),
          style({ opacity: 1, transform: 'translateY(0)',    offset: 1 })
        ]))
      ])
    ]),
    trigger('barAnim', [
      transition(':enter', [
        animate('1800ms 600ms ease-in-out', keyframes([
          style({ width: '0%',   offset: 0    }),
          style({ width: '40%',  offset: 0.3  }),
          style({ width: '70%',  offset: 0.6  }),
          style({ width: '90%',  offset: 0.85 }),
          style({ width: '100%', offset: 1    })
        ]))
      ])
    ])
  ],
  template: `
    <div [@fadeOut]="splashState"
         style="position:fixed;inset:0;z-index:9999;
                display:flex;flex-direction:column;
                align-items:center;justify-content:center;
                background:linear-gradient(145deg,#0D3349 0%,#1A5276 45%,#1E8449 100%);
                overflow:hidden;">

      <!-- Cercles décoratifs en arrière-plan -->
      <div style="position:absolute;width:500px;height:500px;border-radius:50%;
                  border:1px solid rgba(255,255,255,0.05);top:-100px;right:-100px;"></div>
      <div style="position:absolute;width:350px;height:350px;border-radius:50%;
                  border:1px solid rgba(255,255,255,0.07);bottom:-80px;left:-80px;"></div>
      <div style="position:absolute;width:200px;height:200px;border-radius:50%;
                  background:rgba(39,174,96,0.08);top:20%;left:10%;"></div>

      <!-- Logo animé -->
      <div [@logoAnim] style="text-align:center;position:relative;z-index:1;">

        <!-- Logo principal -->
        <div style="border-radius:32px;background:rgba(255,255,255,0.94);
                    backdrop-filter:blur(12px);
                    border:1px solid rgba(255,255,255,0.55);
                    display:flex;align-items:center;justify-content:center;
                    margin:0 auto 24px;padding:18px 24px;
                    width:min(320px,82vw);
                    box-shadow:0 18px 44px rgba(0,0,0,0.32);">
          <img src="assets/brand/steevacare-logo.png"
               alt="SteevaCare - Télémédecine pour l'Afrique"
               style="display:block;width:100%;height:auto;">
        </div>

        <!-- Slogan -->
        <div [@textAnim] style="margin-top:12px;">
          <p style="color:rgba(255,255,255,0.75);font-size:15px;
                    letter-spacing:1.5px;font-weight:300;text-transform:uppercase;
                    font-family:'Roboto',sans-serif;">
            Votre santé, notre priorité
          </p>
          <p style="color:rgba(255,255,255,0.45);font-size:12px;
                    margin-top:6px;letter-spacing:0.5px;">
            par <strong style="color:rgba(255,255,255,0.65);">QuamTechs</strong>
            &nbsp;—&nbsp; Cameroun 🇨🇲
          </p>
        </div>
      </div>

      <!-- Barre de chargement -->
      <div style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);
                  width:260px;text-align:center;">
        <div style="background:rgba(255,255,255,0.12);border-radius:100px;
                    height:4px;overflow:hidden;margin-bottom:14px;">
          <div [@barAnim]
               style="height:100%;border-radius:100px;
                      background:linear-gradient(90deg,#27AE60,#2ECC71);
                      box-shadow:0 0 10px rgba(39,174,96,0.6);">
          </div>
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:11px;
                  letter-spacing:1px;font-family:'Roboto',sans-serif;">
          {{loadingText}}
        </p>
      </div>

      <!-- Points pulsants -->
      <div style="position:absolute;bottom:40px;display:flex;gap:8px;">
        <div *ngFor="let d of [0,1,2]; trackBy: trackByItem"
             [style.animation-delay]="(d*200)+'ms'"
             style="width:6px;height:6px;border-radius:50%;
                    background:rgba(255,255,255,0.4);
                    animation:pulse 1.2s ease-in-out infinite;">
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse {
      0%, 100% { transform: scale(1);   opacity: 0.4; }
      50%       { transform: scale(1.4); opacity: 1;   }
    }
  `]
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  @Output() splashDone = new EventEmitter<void>();

  splashState = 'visible';
  loadingText = 'Initialisation...';
  private readonly maxSplashDurationMs = 3000;
  private readonly fadeOutDurationMs = 650;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private emitTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isCompleted = false;

  private loadingMessages = [
    'Initialisation...',
    'Chargement des services...',
    'Connexion sécurisée...',
    'Presque prêt...'
  ];

  ngOnInit(): void {
    let i = 0;
    this.intervalId = setInterval(() => {
      i++;
      if (i < this.loadingMessages.length) {
        this.loadingText = this.loadingMessages[i];
      } else if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }, 700);

    // Fallback de sécurité : le splash disparaît au plus tard après 3 secondes,
    // même si une vérification API du token reste bloquée ou échoue côté parent.
    this.fallbackTimeoutId = setTimeout(() => {
      this.completeSplash();
    }, this.maxSplashDurationMs);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) clearInterval(this.intervalId);
    if (this.fallbackTimeoutId !== null) clearTimeout(this.fallbackTimeoutId);
    if (this.emitTimeoutId !== null) clearTimeout(this.emitTimeoutId);
  }

  private completeSplash(): void {
    if (this.isCompleted) return;

    this.isCompleted = true;
    this.splashState = 'hidden';
    this.emitTimeoutId = setTimeout(() => this.splashDone.emit(), this.fadeOutDurationMs);
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }

}
