export default {
  template: `
    <div class="navbar">
      <div class="navbar-brand">
        <img src="/static/logo.png" alt="ParkEZ Logo" class="navbar-logo">
        <span class="brand-text">ParkEZ</span>
      </div>
      <div class="nav-links">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/login" class="nav-link">Login</router-link>
        <router-link to="/register" class="nav-link">Register</router-link>
      </div>
    </div>
  `,
  mounted() {
    const style = document.createElement('style');
    style.textContent = `
      .navbar {
        background-color: #333;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .navbar-brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .navbar-logo {
        height: 48px;
        width: auto;
        max-width: 50px;
      }
      
      .brand-text {
        color: white;
        font-weight: bold;
        font-size: 1.5rem;
      }
      
      .nav-links {
        display: flex;
        gap: 1rem;
      }
      
      .nav-link {
        color: white;
        text-decoration: none;
        font-weight: bold;
      }
      
      .nav-link:hover {
        color: #f0a500;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
        }
        
        .nav-links {
          width: 100%;
          justify-content: center;
        }
      }
    `;
    document.head.appendChild(style);
  }
}