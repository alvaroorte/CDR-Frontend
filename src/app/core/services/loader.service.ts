import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  public isLoading = signal<boolean>(false);
  public countIn: number = 0;
  public countOut: number = 0;

  public show(): void {
    this.countIn++;
    this.isLoading.set(true);
  }
  
  public hide(): void {
    this.countOut++;
    if (this.countIn === this.countOut) {
      this.isLoading.set(false);
      this.countIn = 0;
      this.countOut = 0;
    }
  }
}
