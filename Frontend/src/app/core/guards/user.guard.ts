import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): boolean {
    try {
      this.authService.refreshAuthState();      
      if (this.authService.isAuthenticated()) {
        const currentUser = this.authService.getCurrentUser();
        console.log(`✅ User: ${currentUser?.email} accessing: ${url}`);
        return true;
      }
            
      if (console) {
        this.authService.debugAuthState();
      }
      
      if (url && url !== '/login' && url !== '/register') {
        localStorage.setItem('redirectUrl', url);
      }
      
      this.router.navigate(['/login']);
      return false;
    } catch (error) {
      this.router.navigate(['/login']);
      return false;
    }
  }
}