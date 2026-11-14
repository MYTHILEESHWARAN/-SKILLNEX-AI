/**
 * SKILLNEX AI — 3D Effects & Interactions
 * Enhanced premium experience with parallax, depth effects, and smooth animations
 */

// ── PARALLAX TRACKING ──
document.addEventListener('mousemove', (e) => {
  const cards = document.querySelectorAll('.hover-lift, .card-hover, .feature-card, .stat-card');
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;

  cards.forEach(card => {
    if (card.getBoundingClientRect().top < window.innerHeight) {
      const rotX = (mouseY - 0.5) * 8;
      const rotY = (mouseX - 0.5) * 8;
      
      // Subtle parallax effect
      card.style.setProperty('--parallax-x', `${rotX}deg`);
      card.style.setProperty('--parallax-y', `${rotY}deg`);
    }
  });
});

// ── INTERSECTION OBSERVER FOR STAGGERED REVEALS ──
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting && !entry.target.classList.contains('revealed')) {
      entry.target.classList.add('revealed');
      entry.target.style.animationDelay = `${index * 50}ms`;
    }
  });
}, observerOptions);

// Observe all cards for reveal
document.querySelectorAll('.card, .feature-card, .stat-card, .persona-card, .pricing-card, .week-card').forEach(el => {
  revealObserver.observe(el);
});

// ── SMOOTH SCROLL BEHAVIOR ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── NAVBAR SCROLL EFFECT ──
let lastScrollY = 0;
const navbar = document.getElementById('mainNav');

if (navbar) {
  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    
    if (lastScrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ── ANIMATED COUNTER ──
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;

  const updateCounter = () => {
    current += increment;
    if (current < target) {
      element.textContent = Math.floor(current);
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target;
    }
  };

  updateCounter();
}

// Observe stats for animation
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
      entry.target.classList.add('animated');
      
      // Animate numeric values
      const values = entry.target.querySelectorAll('[data-value]');
      values.forEach(val => {
        const target = parseInt(val.getAttribute('data-value'));
        if (!isNaN(target)) {
          animateCounter(val, target);
        }
      });
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.stat-card, .hero-stat-value').forEach(el => {
  statsObserver.observe(el);
});

// ── SCROLL-LINKED ANIMATIONS ──
function updateScrollAnimations() {
  const scrolled = window.scrollY;
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  
  parallaxElements.forEach(el => {
    const speed = el.getAttribute('data-parallax') || 0.5;
    el.style.transform = `translateY(${scrolled * speed}px)`;
  });
}

window.addEventListener('scroll', updateScrollAnimations, { passive: true });

// ── PAGE LOAD ANIMATION ──
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
  
  // Trigger initial animations
  document.querySelectorAll('.animate-fadeInUp, .animate-scaleIn').forEach((el, index) => {
    el.style.animationDelay = `${index * 30}ms`;
  });
});

// ── DEPTH EFFECT ON CARDS ──
document.querySelectorAll('.depth-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rotX = ((y / rect.height) - 0.5) * 10;
    const rotY = ((x / rect.width) - 0.5) * 10;
    
    card.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0)';
  });
});

// ── PROGRESS BAR ANIMATION ──
const progressBars = document.querySelectorAll('.progress-fill');
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.classList.contains('animated-progress')) {
      entry.target.classList.add('animated-progress');
      const width = entry.target.style.width;
      entry.target.style.width = '0%';
      
      setTimeout(() => {
        entry.target.style.transition = 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        entry.target.style.width = width;
      }, 100);
    }
  });
}, { threshold: 0.5 });

progressBars.forEach(bar => progressObserver.observe(bar));

// ── RANDOM GLOW ANIMATION ──
function randomizeGlowBreathe() {
  const glows = document.querySelectorAll('.glow-orb, .pulse-glow');
  glows.forEach(glow => {
    const duration = 4 + Math.random() * 2;
    glow.style.animationDuration = `${duration}s`;
  });
}

randomizeGlowBreathe();

console.log('✨ SKILLNEX AI — Premium 3D Effects Loaded');
