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
      // First, refresh the auth state to ensure we have the latest status
      this.authService.refreshAuthState();
      
      // Check if user is authenticated (includes token validation and expiration check)
      if (this.authService.isAuthenticated()) {
        const currentUser = this.authService.getCurrentUser();
        console.log("✅ User access granted - Valid authentication");
        console.log(`✅ User: ${currentUser?.email} accessing: ${url}`);
        return true;
      }
      
      // User is not authenticated
      console.warn("⛔️ User access denied - Authentication required");
      console.warn(`⛔️ Attempted to access: ${url}`);
      
      // Debug authentication state
      if (console) {
        this.authService.debugAuthState();
      }
      
      // Store the attempted URL for redirecting after login
      if (url && url !== '/login' && url !== '/register') {
        localStorage.setItem('redirectUrl', url);
        console.log(`💾 Stored redirect URL: ${url}`);
      }
      
      // Redirect to login page
      this.router.navigate(['/login']);
      return false;
    } catch (error) {
      console.error('❌ Error in UserGuard:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
