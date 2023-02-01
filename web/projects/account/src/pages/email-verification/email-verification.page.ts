import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-email-verification',
  templateUrl: './email-verification.page.html',
  styleUrls: ['./email-verification.page.scss']
})
export class EmailVerificationPage implements OnInit  {

    date: string;
    message: string;
    code: string;

    constructor(
        private service: UserService,
        private router: Router,
    ) {};




    complete(code: string) {
        this.code = code;
    }

    onInput() {
        this.message = null!;
    }

    async verify() {
        try {
            const result: any = await this.service.post({ code: this.code }, "/email-verification");            

            if(result.updated) {
                this.router.navigate([""]);
            }

        } catch (e: any) {
            if(e.status == 400) {
                if(e.error.reason == "NoCode") {
                    this.router.navigate([""]);
                }
            } else if(e.status == 403) {
                if(e.error.reason == "IncorrectCode") {
                    this.message = "Incorrect code";
                }
            }
        }
    }


    async ngOnInit() {
        const result: any = await this.service.get("email-verification");

        if(!result) {
            return this.router.navigate([""]);
        }

        this.date = result.date;


        return;
    }

}
