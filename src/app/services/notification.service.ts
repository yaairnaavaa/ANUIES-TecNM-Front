import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(private toastr: ToastrService) { }

    success(message: string, title?: string) {
        this.toastr.success(message, title);
    }

    error(message: string, title?: string) {
        this.toastr.error(message, title);
    }

    info(message: string, title?: string) {
        this.toastr.info(message, title);
    }

    warning(message: string, title?: string) {
        this.toastr.warning(message, title);
    }
    async confirm(message: string, title: string = '¿Estás seguro?', confirmButtonText: string = 'Sí, confirmar', cancelButtonText: string = 'Cancelar'): Promise<boolean> {
        const result = await Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmButtonText,
            cancelButtonText: cancelButtonText,
            heightAuto: false
        });
        return result.isConfirmed;
    }
}
