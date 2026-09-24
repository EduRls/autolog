import { ModalController, ToastController } from '@ionic/angular';
import { PersonalDocumentStorageService } from '../../../services/personal/personal-document-storage.service';
import { PersonalExpedienteService } from '../../../services/personal/personal-expediente.service';
import { SubirDocumentoPersonalComponent } from './subir-documento-personal.component';

describe('SubirDocumentoPersonalComponent', () => {
  it('acepta un archivo válido arrastrado a la zona de carga', async () => {
    const documentStorage = jasmine.createSpyObj<PersonalDocumentStorageService>(
      'PersonalDocumentStorageService',
      ['assertValidFile']
    );
    const component = new SubirDocumentoPersonalComponent(
      jasmine.createSpyObj<PersonalExpedienteService>('PersonalExpedienteService', ['uploadDocumento']),
      documentStorage,
      jasmine.createSpyObj<ModalController>('ModalController', ['dismiss']),
      jasmine.createSpyObj<ToastController>('ToastController', ['create'])
    );
    component.target = {
      tipoPersonal: 'DISTRIBUIDOR', personalId: 'distributor-1', nombreCompleto: 'Distribuidor Uno',
      detalle: 'D-1 · Ruta 1', activo: true,
    };
    component.ngOnInit();
    const file = new File(['contenido'], 'contrato.pdf', { type: 'application/pdf' });
    const event = {
      preventDefault: jasmine.createSpy('preventDefault'),
      dataTransfer: { files: [file] },
    } as unknown as DragEvent;

    await component.onDrop(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(documentStorage.assertValidFile).toHaveBeenCalledWith(file);
    expect(component.selectedFile).toBe(file);
    expect(component.documentoForm.controls.nombre.value).toBe('contrato');
  });
});
