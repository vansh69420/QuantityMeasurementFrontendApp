import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HistoryEntity, QuantityDtoResponse } from './quantity.models';

@Injectable({ providedIn: 'root' })
export class QuantityService {
  constructor(private http: HttpClient) {}

  compare(payload: any): Promise<QuantityDtoResponse> {
    return firstValueFrom(this.http.post<QuantityDtoResponse>('/api/quantity/compare', payload));
  }

  convert(payload: any): Promise<QuantityDtoResponse> {
    return firstValueFrom(this.http.post<QuantityDtoResponse>('/api/quantity/convert', payload));
  }

  add(payload: any): Promise<QuantityDtoResponse> {
    return firstValueFrom(this.http.post<QuantityDtoResponse>('/api/quantity/add', payload));
  }

  subtract(payload: any): Promise<QuantityDtoResponse> {
    return firstValueFrom(this.http.post<QuantityDtoResponse>('/api/quantity/subtract', payload));
  }

  divide(payload: any): Promise<QuantityDtoResponse> {
    return firstValueFrom(this.http.post<QuantityDtoResponse>('/api/quantity/divide', payload));
  }

  getHistory(): Promise<HistoryEntity[]> {
    return firstValueFrom(this.http.get<HistoryEntity[]>('/api/quantity/history'));
  }
}
