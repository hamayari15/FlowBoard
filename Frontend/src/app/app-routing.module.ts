import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserGuard } from './core/guards/user.guard';

import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { WorkSpaceComponent } from './work-space/work-space.component';

const routes: Routes = [

    { path: '', component: HomeComponent},
    {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
    },
    { path: 'register', component: RegisterComponent},
    { path: 'login', component: LoginComponent},
    { path: 'workSpace', component: WorkSpaceComponent, canActivate:[UserGuard]}
    
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  static components = [];
}
