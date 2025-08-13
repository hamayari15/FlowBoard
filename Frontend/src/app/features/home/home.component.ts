import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  // Animation states for floating cards
  isVisible = false;

  // Statistics data (you can later connect this to a service)
  stats = {
    users: '10K+',
    projects: '50K+',
    uptime: '99%',
  };

  // Feature data
  features = [
    {
      icon: 'fas fa-project-diagram',
      title: 'Project Planning',
      description:
        'Create detailed project plans with timelines, milestones, and dependencies to keep everything on track.',
    },
    {
      icon: 'fas fa-users-cog',
      title: 'Team Management',
      description:
        'Assign tasks, set permissions, and track team performance with our comprehensive management tools.',
    },
    {
      icon: 'fas fa-chart-bar',
      title: 'Real-time Analytics',
      description:
        'Get insights into project progress, team productivity, and resource allocation with live dashboards.',
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Mobile Ready',
      description:
        'Access your projects anywhere, anytime with our responsive design and mobile applications.',
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Enterprise Security',
      description:
        'Your data is protected with enterprise-grade security, encryption, and compliance standards.',
    },
    {
      icon: 'fas fa-puzzle-piece',
      title: 'Integrations',
      description:
        'Connect with your favorite tools including Slack, GitHub, Google Workspace, and many more.',
    },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Trigger animations after component loads
    setTimeout(() => {
      this.isVisible = true;
    }, 100);

    // Optional: Add scroll animations or other initialization logic
    this.initializeAnimations();
  }

  ngOnDestroy(): void {
    // Cleanup any subscriptions or intervals if needed
  }

  // Navigation methods
  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToDemo(): void {
    // You can implement demo functionality or navigate to demo page
    this.router.navigate(['/demo']);
  }

  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  // Method to handle feature card clicks (optional)
  onFeatureClick(feature: any): void {
    console.log('Feature clicked:', feature.title);
    // You can implement navigation to specific feature pages
  }

  // Initialize scroll animations (optional enhancement)
  private initializeAnimations(): void {
    // You can add IntersectionObserver for scroll animations
    // This is a basic implementation - you might want to use Angular Animations or external libraries

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe feature cards when they come into view
    setTimeout(() => {
      const featureCards = document.querySelectorAll('.feature-card');
      featureCards.forEach((card) => observer.observe(card));
    }, 500);
  }

  // Method to handle CTA button clicks with analytics (optional)
  onCTAClick(action: string): void {
    console.log('CTA clicked:', action);

    // You can add analytics tracking here
    // Example: this.analytics.track('cta_clicked', { action });

    switch (action) {
      case 'get-started':
        this.navigateToRegister();
        break;
      case 'contact-sales':
        this.navigateToContact();
        break;
      case 'watch-demo':
        this.navigateToDemo();
        break;
    }
  }

  // Optional: Method to load dynamic stats from API
  loadStats(): void {
    // This is where you would typically call a service to get real stats
    // Example:
    // this.statsService.getStats().subscribe(stats => {
    //   this.stats = stats;
    // });
  }

  // Optional: Smooth scroll to features section
  scrollToFeatures(): void {
    const featuresSection = document.querySelector('.features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }
}
