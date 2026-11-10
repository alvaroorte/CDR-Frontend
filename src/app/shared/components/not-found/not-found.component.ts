
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-not-found',
    templateUrl: './not-found.component.html',
    imports: [RouterModule],
    styles: [`
    .container-not-found {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .error-container {
        text-align: center;
        background-color: rgb(227 227 227 / 83%);
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
    }
    .error-container img {
        max-width: 20vw;
        margin-right: 20px;
    }
    h1 {
        color: #ff5733;
        font-size: 80px;
    }
    h3 {
        color: #ff7354;
        font-size: 40px;
    }

    p {
      margin-top: 2rem;
        font-size: 20px;
    }

    a {
        text-decoration: none;
        color: #ff5733;
    }

    a:hover {
        text-decoration: underline;
    }`
    ]
})
export class NotFoundComponent {

}
