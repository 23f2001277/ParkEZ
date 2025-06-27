export default {
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <div class="logo-container">
            <div class="logo-placeholder">🅿️</div>
            <span class="brand-text">Park<span class="brand-accent">EZ</span></span>
          </div>
        </div>
        
        <div class="nav-menu" :class="{ 'active': isMenuOpen }">
          <router-link to="/" class="nav-link" @click="closeMenu">
            <span class="nav-icon">🏠</span>
            <span>Home</span>
          </router-link>
          <router-link to="/login" class="nav-link" @click="closeMenu">
            <span class="nav-icon">🔐</span>
            <span>Login</span>
          </router-link>
          <router-link to="/register" class="nav-link nav-link-cta" @click="closeMenu">
            <span class="nav-icon">✨</span>
            <span>Get Started</span>
          </router-link>
        </div>

        <div class="mobile-menu-toggle" @click="toggleMenu">
          <span class="hamburger-line" :class="{ 'active': isMenuOpen }"></span>
          <span class="hamburger-line" :class="{ 'active': isMenuOpen }"></span>
          <span class="hamburger-line" :class="{ 'active': isMenuOpen }"></span>
        </div>
      </div>
    </nav>
  `,
  data() {
    return {
      isMenuOpen: false
    };
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    closeMenu() {
      this.isMenuOpen = false;
    }
  },
  mounted() {
    const style = document.createElement('style');
    style.textContent = `
      .navbar {
        background: linear-gradient(135deg, rgba(26, 35, 126, 0.95) 0%, rgba(49, 27, 146, 0.95) 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }
      
      .navbar-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0.75rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .navbar-brand {
        z-index: 1001;
      }
      
      .logo-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        transition: transform 0.3s ease;
      }
      
      .logo-container:hover {
        transform: scale(1.05);
      }
      
      .logo-placeholder {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #f0a500 0%, #ff6b35 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        box-shadow: 0 4px 15px rgba(240, 165, 0, 0.3);
        animation: logoGlow 2s ease-in-out infinite alternate;
      }
      
      @keyframes logoGlow {
        from { box-shadow: 0 4px 15px rgba(240, 165, 0, 0.3); }
        to { box-shadow: 0 6px 25px rgba(240, 165, 0, 0.5); }
      }
      
      .brand-text {
        color: white;
        font-weight: 800;
        font-size: 1.75rem;
        letter-spacing: -0.5px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .brand-accent {
        background: linear-gradient(45deg, #f0a500, #ff6b35);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .nav-menu {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        font-weight: 600;
        font-size: 1rem;
        padding: 0.75rem 1.25rem;
        border-radius: 25px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .nav-link::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s ease;
      }
      
      .nav-link:hover::before {
        left: 100%;
      }
      
      .nav-link:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }
      
      .nav-link.router-link-active {
        background: rgba(240, 165, 0, 0.2);
        color: #f0a500;
        box-shadow: 0 2px 10px rgba(240, 165, 0, 0.3);
      }
      
      .nav-link-cta {
        background: linear-gradient(135deg, #f0a500 0%, #ff6b35 100%);
        color: white !important;
        font-weight: 700;
        box-shadow: 0 4px 15px rgba(240, 165, 0, 0.4);
        margin-left: 0.5rem;
      }
      
      .nav-link-cta:hover {
        background: linear-gradient(135deg, #ff6b35 0%, #f0a500 100%);
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(240, 165, 0, 0.6);
      }
      
      .nav-icon {
        font-size: 1.1rem;
        opacity: 0.8;
      }
      
      .mobile-menu-toggle {
        display: none;
        flex-direction: column;
        cursor: pointer;
        padding: 0.5rem;
        z-index: 1001;
      }
      
      .hamburger-line {
        width: 25px;
        height: 3px;
        background: white;
        margin: 3px 0;
        transition: all 0.3s ease;
        border-radius: 2px;
      }
      
      .hamburger-line.active:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }
      
      .hamburger-line.active:nth-child(2) {
        opacity: 0;
      }
      
      .hamburger-line.active:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .navbar-container {
          padding: 1rem;
        }
        
        .mobile-menu-toggle {
          display: flex;
        }
        
        .nav-menu {
          position: fixed;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, rgba(26, 35, 126, 0.98) 0%, rgba(49, 27, 146, 0.98) 100%);
          backdrop-filter: blur(20px);
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          transition: left 0.3s ease;
          z-index: 1000;
        }
        
        .nav-menu.active {
          left: 0;
        }
        
        .nav-link {
          font-size: 1.25rem;
          padding: 1rem 2rem;
          width: 80%;
          text-align: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .nav-link-cta {
          background: linear-gradient(135deg, #f0a500 0%, #ff6b35 100%);
          border: none;
          margin-left: 0;
        }
        
        .brand-text {
          font-size: 1.5rem;
        }
        
        .logo-placeholder {
          width: 40px;
          height: 40px;
          font-size: 1.25rem;
        }
      }
      
      @media (max-width: 480px) {
        .navbar-container {
          padding: 0.75rem;
        }
        
        .brand-text {
          font-size: 1.3rem;
        }
        
        .logo-placeholder {
          width: 36px;
          height: 36px;
          font-size: 1.1rem;
        }
        
        .nav-link {
          font-size: 1.1rem;
          padding: 0.875rem 1.5rem;
        }
      }
      
      /* Smooth scrolling for anchor links */
      html {
        scroll-behavior: smooth;
      }
      
      /* Add some subtle animations */
      @keyframes slideInFromTop {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .navbar {
        animation: slideInFromTop 0.5s ease;
      }
    `;
    document.head.appendChild(style);
  }
}