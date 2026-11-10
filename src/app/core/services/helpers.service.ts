import { MessageService } from 'primeng/api';
import { inject, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class HelpersService {

    private messageService = inject(MessageService);

    public messageNotification(severity: string, title: string,  detail: string, life?: number, stycky: boolean = false) {
        severity = severity;
        title = title;
        detail = detail;
        life = life? life: 3000;
        this.messageService.add({ severity: severity, summary: title, detail: detail, life: life, sticky: stycky });
    }

    public cleanNotifications() {
        this.messageService.clear();
    }
}
