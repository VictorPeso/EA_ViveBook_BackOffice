import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import VisitsSumamry from '../models/VisitsSummary';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class MatomoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/matomo';

  readVersion(): Observable<ApiResponse<{ version: string }>> {
    return this.http.get<ApiResponse<{ version: string }>>(`${this.apiUrl}/version`);
  }

  readSummary(): Observable<ApiResponse<VisitsSumamry>> {
    return this.http.get<ApiResponse<VisitsSumamry>>(`${this.apiUrl}/summary`);
  }
}
