import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserGuard } from './core/guards/user.guard';

import { HomeComponent } from './features/home/home.component';
import { AboutComponent } from './features/about/about.component';
import { PrivacyComponent } from './features/privacy/privacy.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { WorkspaceListComponent } from './features/workSpace/work-spaces-list/work-spaces-list.component';
import { WorkSpaceDetailsComponent } from './features/workSpace/work-space-details/work-space-details.component';
import { ProjectDetailsComponent } from './features/workSpace/project-details/project-details.component';
import { WorkSpaceStatsComponent } from './features/workSpace/work-space-stats/work-space-stats.component';
import { BoardViewComponent } from './features/board/board-view.component';

const routes: Routes = [

    { path: '', component: HomeComponent},
    {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
    },
    { path: 'about', component: AboutComponent},
    { path: 'privacy', component: PrivacyComponent},
    { path: 'register', component: RegisterComponent},
    { path: 'login', component: LoginComponent},
    { path: 'workSpaces-list', component: WorkspaceListComponent, canActivate:[UserGuard]},
    { path: 'workSpace-details/:id', component: WorkSpaceDetailsComponent, canActivate:[UserGuard]},
    { path: 'project-details/:id', component: ProjectDetailsComponent, canActivate:[UserGuard]},
    { path: 'workSpace-stats/:id', component: WorkSpaceStatsComponent, canActivate:[UserGuard]},
    { path: 'board/:boardId', component: BoardViewComponent, canActivate:[UserGuard]},
    
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {
  static components = [];
}
