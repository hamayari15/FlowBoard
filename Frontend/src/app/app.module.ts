import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { NavbarComponent } from './features/navbar/navbar.component';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { FooterComponent } from './features/footer/footer.component';
import { WorkspaceListComponent } from './features/workSpace/work-spaces-list/work-spaces-list.component';
import { AddWorkSpaceComponent } from './features/workSpace/add-work-space/add-work-space.component';
import { EditWorkSpaceComponent } from './features/workSpace/edit-work-space/edit-work-space.component';
import { WorkSpaceDetailsComponent } from './features/workSpace/work-space-details/work-space-details.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    RegisterComponent,
    LoginComponent,
    FooterComponent,
    WorkspaceListComponent,
    AddWorkSpaceComponent,
    EditWorkSpaceComponent,
    WorkSpaceDetailsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
