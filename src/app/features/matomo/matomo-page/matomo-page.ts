import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { getApiErrorMessage } from '../../../Core/models/api-response.model';
import VisitsSumamry from '../../../Core/models/VisitsSummary';
import { MatomoService } from '../../../Core/services/matomo.service';
import { ToastService } from '../../../Core/services/toast.service';

@Component({
  selector: 'app-matomo-page',
  templateUrl: './matomo-page.html',
  styleUrl: './matomo-page.css',
})
export class MatomoPage implements OnInit {
  readonly version = signal<string | null>(null);
  readonly summary = signal<Partial<VisitsSumamry>>({});
  readonly isLoadingVersion = signal(false);
  readonly isLoadingSummary = signal(false);

  private readonly matomoService = inject(MatomoService);
  private readonly toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loadVersion();
    this.loadSummary();
  }

  formatNumber(value: number | undefined): string {
    return value === undefined ? 'Sin datos' : value.toLocaleString('es-ES');
  }

  formatDuration(seconds: number | undefined): string {
    if (seconds === undefined) return 'Sin datos';

    const roundedSeconds = Math.max(0, Math.round(seconds));
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const remainingSeconds = roundedSeconds % 60;

    if (hours > 0) return `${hours} h ${minutes} min`;
    if (minutes > 0) return `${minutes} min ${remainingSeconds} s`;
    return `${remainingSeconds} s`;
  }

  private loadVersion(): void {
    this.isLoadingVersion.set(true);
    this.matomoService
      .readVersion()
      .pipe(finalize(() => this.isLoadingVersion.set(false)))
      .subscribe({
        next: (res) => {
          this.version.set(res.data.version);
        },
        error: (error) => {
          this.version.set(null);
          this.showError(error, 'No se pudo comprobar la conexión con Matomo.');
        },
      });
  }

  private loadSummary(): void {
    this.isLoadingSummary.set(true);
    this.matomoService
      .readSummary()
      .pipe(finalize(() => this.isLoadingSummary.set(false)))
      .subscribe({
        next: (res) => {
          this.summary.set(res.data);
        },
        error: (error) => {
          this.summary.set({});
          this.showError(error, 'No se pudieron cargar las estadísticas de Matomo.');
        },
      });
  }

  private showError(error: unknown, fallbackMessage: string): void {
    this.toastService.error(getApiErrorMessage(error, fallbackMessage));
  }
}
