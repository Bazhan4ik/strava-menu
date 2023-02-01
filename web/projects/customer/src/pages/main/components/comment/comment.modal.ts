import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-comment',
    templateUrl: './comment.modal.html',
    styleUrls: ['./comment.modal.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
})
export class CommentModal implements OnInit {

    newComment: string;

    @Output() leave = new EventEmitter();

    @Input() comment: string;

    close() {
        this.leave.emit();
    }

    save() {
        this.leave.emit(this.newComment == "" ? "remove" : this.newComment);
    }


    ngOnInit(): void {
        if(this.comment) {
            this.newComment = this.comment;
        }
    }
}
