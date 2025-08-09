import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserGuard } from './core/guards/user.guard';

import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { GuardTestComponent } from './guard-test/guard-test.component';

const routes: Routes = [

    { path: '', component: HomeComponent},
    { path: 'home', component: HomeComponent},
    { path: 'register', component: RegisterComponent},
    { path: 'guardTest', component: GuardTestComponent, canActivate:[UserGuard]},
    { path: 'login', component: LoginComponent}
    
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  static components = [];
}
