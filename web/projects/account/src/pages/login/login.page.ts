import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage implements OnInit {

    form: FormGroup;

    mainLink = "";
    supportLink = "";

    message: string;

    constructor(
        private service: UserService,
        private router: Router,
    ) {}

    async submit() {
        const { email, password, } = this.form.value;

        if(this.form.invalid || !email || !password) {
            return;
        }


        try {
            const result = await this.service.login(email, password);

            if(result) {
                this.router.navigate(["home"]);
            }
        } catch (error: any) {
            if(error.status == 403) {
                if(error.error.reason == "IncorrectData") {
                    this.message = "Incorrect password";
                }
            }
        }
    }

    onPasswordInput() {
        this.message = null!;
    }

    ngOnInit(): void {


        this.form = new FormGroup({
            email: new FormControl("", Validators.required),
            password: new FormControl("", Validators.required),
        });


    }
}
