
import { Component, inject } from '@angular/core';
import { LoaderService } from '@core/services/loader.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent {
  
  public loaderService = inject(LoaderService);

}
