import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth/auth.service';
import { FirebaseService } from '../services/firebase/firebase.service';
import { StorageService } from '../services/storage/storage.service';
import { LoginPage } from './login.page';

describe('LoginPage: destinos según acceso', () => {
  for (const administrative of [true, false]) it(`AUTOLOG permitido=${administrative}`, async () => {
    const auth = jasmine.createSpyObj<AuthService>('auth', ['login', 'logout']);
    auth.login.and.resolveTo({user: {uid: 'uid-1'}} as never);
    const firebase = jasmine.createSpyObj<FirebaseService>('firebase', ['getUserProfile']);
    firebase.getUserProfile.and.resolveTo({data: () => ({rol: administrative ? 'admin' : 'empleado', tipoPersonal: administrative ? 'SISTEMA' : 'DISTRIBUIDOR', accesoAutolog: administrative, accesoAsistencia: !administrative})} as never);
    const storage = jasmine.createSpyObj<StorageService>('storage', ['set']);
    const router = jasmine.createSpyObj<Router>('router', ['navigate']);
    const loading = {create: async () => ({present: async () => undefined, dismiss: async () => undefined})} as LoadingController;
    const component = new LoginPage(new FormBuilder(), auth, router, loading, {} as ToastController, firebase, storage);
    spyOn(component, 'showToast').and.resolveTo();
    component.ngOnInit();
    component.loginForm.setValue({email: 'account@example.com', password: 'temporary1'});
    await component.login();
    expect(router.navigate).toHaveBeenCalledOnceWith([administrative ? '/home' : '/reloj']);
    if (!administrative) expect(storage.set).not.toHaveBeenCalled();
  });
});
