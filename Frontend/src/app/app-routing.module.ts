import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserGuard } from './core/guards/user.guard';

import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { WorkspaceListComponent } from './features/workSpace/work-spaces-list/work-spaces-list.component';
import { AddWorkSpaceComponent } from './features/workSpace/add-work-space/add-work-space.component';
import { EditWorkSpaceComponent } from './features/workSpace/edit-work-space/edit-work-space.component';

const routes: Routes = [

    { path: '', component: HomeComponent},
    {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
    },
    { path: 'register', component: RegisterComponent},
    { path: 'login', component: LoginComponent},
    { path: 'workSpaces-list', component: WorkspaceListComponent, canActivate:[UserGuard]},
    { path: 'add-workSpace', component: AddWorkSpaceComponent, canActivate:[UserGuard]},
    { path: 'edit-workSpace/:id', component: EditWorkSpaceComponent, canActivate:[UserGuard]}
    
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  static components = [];
}
