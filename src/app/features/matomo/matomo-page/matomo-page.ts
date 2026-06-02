import { Component, inject, OnInit, signal } from '@angular/core';
import { MatomoService } from '../../../Core/services/matomo.service';
import { Toast } from '../../../shared/components/toast/toast';
import { ToastService } from '../../../Core/services/toast.service';
import VisitsSumamry from '../../../Core/models/VisitsSummary';

@Component({
  selector: 'app-matomo-page',
  imports: [Toast],
  templateUrl: './matomo-page.html',
  styleUrl: './matomo-page.css',
})
export class MatomoPage implements OnInit {
  version = signal<string>('unknown');
  summary = signal<Partial<VisitsSumamry>>({});

  matomoService = inject(MatomoService);
  toastService = inject(ToastService);

  ngOnInit(): void {
    this.matomoService.readVersion().subscribe({
      next: (res) => {
        this.version.set(res.data.version);
      },
      error: (error) => {
        this.toastService.show('error', `Something went wrong: ${JSON.stringify(error)}`);
      },
    });

    this.matomoService.readSummary()
      .subscribe({
        next: (res) => {
          this.summary.set(res.data);
        },
        error: (error) => { 
          this.toastService.show('error', `Something went wrong: ${JSON.stringify(error)}`);
        }
      });
  }
}
