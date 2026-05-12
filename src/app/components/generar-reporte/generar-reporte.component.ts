import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-generar-reporte',
  templateUrl: './generar-reporte.component.html',
  styleUrls: ['./generar-reporte.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class GenerarReporteComponent implements OnInit {

  @Input() distribuidores: any[] = [];


  reporteForm: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    this.reporteForm = this.fb.group({
      zona: ['todo'],
      vendedor: [''],
      incluirFechas: [false],
      fechaInicio: [{ value: null, disabled: true }],
      fechaFin: [{ value: null, disabled: true }]
    });

  }
  ngOnInit() {
    this.reporteForm.get('incluirFechas')?.valueChanges.subscribe(usaraFechas => {
      const inicio = this.reporteForm.get('fechaInicio');
      const fin = this.reporteForm.get('fechaFin');

      if (usaraFechas) {
        inicio?.enable();
        fin?.enable();

        // Opcional: establecer fecha actual por defecto
        const hoy = new Date().toISOString().split('T')[0];
        inicio?.setValue(hoy);
        fin?.setValue(hoy);
      } else {
        inicio?.disable();
        fin?.disable();
        inicio?.setValue(null);
        fin?.setValue(null);
      }
    });
  }


  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  generarReporte() {
    const filtros = this.reporteForm.value;
    console.log('Filtros:', filtros);
    this.modalCtrl.dismiss(filtros, 'filtros_aplicados');
  }

}
