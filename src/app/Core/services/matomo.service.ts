import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import VisitsSumamry from '../models/VisitsSummary';

@Injectable({
  providedIn: 'root',
})
export class MatomoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/matomo';

  // no puedo poner observable<string>
  readVersion(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/version`);
  }

  // ni tampoco Observable<VisitsSumamry> -_-
  readSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`);
  }
}
