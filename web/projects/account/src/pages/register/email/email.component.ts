import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'projects/account/src/services/user.service';

@Component({
    selector: 'app-email',
    templateUrl: './email.component.html',
    styleUrls: ['./email.component.scss']
})
export class EmailComponent implements OnInit {
    form: FormGroup;

    passwordMessage: string;

    constructor(
        private service: UserService,
        private router: Router,
    ) { };

    async submit() {
        if(!this.form.valid) {
            return;
        }

        if(this.form.value.password != this.form.value.confirmPassword) {
            return this.passwordMessage = "Passwords are not the same";
        }


        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;


        if(!emailRegex.test(this.form.value.email)) {
            return;
        }


        const result = await this.service.create({
            name: {
                first: this.form.value.firstName,
                last: this.form.value.lastName,
            },
            password: this.form.value.password,
            email: this.form.value.email,
        });

        if(result) {
            this.router.navigate(["verification"]);
        }

        return;
    }

    ngOnInit(): void {
        this.form = new FormGroup({
            firstName: new FormControl("", Validators.required),
            lastName: new FormControl("", Validators.required),
            email: new FormControl("", Validators.required),
            password: new FormControl("", Validators.required),
            confirmPassword: new FormControl("", Validators.required),
        });
    }
}
