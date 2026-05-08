import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HeadersService {

  token : string = '';
  // Es inmutable
  // headers = {
  //   "Content-Type": "application/json",
  //   'Authorization' : '',

  // }

  setToken(data: string) {
    this.token = data;
  }

  //Lazy initialization
  getHeader(): HttpHeaders {
    let headers = new HttpHeaders();
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${this.token}`);

    return headers;
  }
}
