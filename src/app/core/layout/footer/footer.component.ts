import { Component } from '@angular/core';
import { environment } from '@core/environments/environment.development';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  public readonly year: number = new Date().getFullYear();
  public readonly appName = environment.app_name;
}
