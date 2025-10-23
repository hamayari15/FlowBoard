import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';


// Application Components
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { NavbarComponent } from './features/navbar/navbar.component';
import { HomeComponent } from './features/home/home.component';
import { AboutComponent } from './features/about/about.component';
import { PrivacyComponent } from './features/privacy/privacy.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { FooterComponent } from './features/footer/footer.component';
import { WorkspaceListComponent } from './features/work-spaces-list/work-spaces-list.component';
import { WorkSpaceDetailsComponent } from './features/work-space-details/work-space-details.component';
import { WorkSpaceDialogComponent } from './features/work-space-dialog/work-space-dialog.component';
import { ProjectDialogComponent } from './features/project-dialog/project-dialog.component';
import { WorkspaceInviteDialogComponent } from './features/workspace-invite-dialog/workspace-invite-dialog.component';
import { ProjectInviteDialogComponent } from './features/project-invite-dialog/project-invite-dialog.component';
import { ProjectDetailsComponent } from './features/project-details/project-details.component';
import { BoardDialogComponent } from './features/board-dialog/board-dialog.component';
import { BoardViewComponent } from './features/board/board-view.component';
import { TaskDialogComponent } from './features/task-dialog/task-dialog.component';
import { TaskDetailDialogComponent } from './features/task-detail-dialog/task-detail-dialog.component';
import { EditCommentDialogComponent } from './features/edit-comment-dialog/edit-comment-dialog.component';
import { WorkSpaceStatsComponent } from './features/work-space-stats/work-space-stats.component';
import { PageNotFoundComponent } from './features/page-not-found/page-not-found.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    AboutComponent,
    PrivacyComponent,
    RegisterComponent,
    LoginComponent,
    FooterComponent,
    WorkspaceListComponent,
    WorkSpaceDialogComponent,
    WorkSpaceDetailsComponent,
    ProjectDetailsComponent,
    ProjectDialogComponent,
    WorkspaceInviteDialogComponent,
    ProjectInviteDialogComponent,
    BoardViewComponent,
    BoardDialogComponent,
    BoardViewComponent,
    TaskDialogComponent,
    TaskDetailDialogComponent,
    EditCommentDialogComponent,
    WorkSpaceStatsComponent,
    PageNotFoundComponent
  ],
  imports: [
    // Angular Core Modules
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule,
    AppRoutingModule,
    
    // Angular Material Modules
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatMenuModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DragDropModule,
    MatButtonToggleModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
