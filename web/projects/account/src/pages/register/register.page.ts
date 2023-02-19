import { Component } from '@angular/core';
import { env } from 'environment/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage {
    supportLink = "";
    mainLink = "";
    googleLink = "";

    constructor() {
        this.mainLink = env.publicUrl;
    }
}
