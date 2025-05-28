export default {
  template: `
    <div class="navbar">
      <router-link to="/" class="nav-link">Home</router-link>
      <router-link to="/login" class="nav-link">Login</router-link>
      <router-link to="/register" class="nav-link">Register</router-link>
    </div>
  `,
  mounted() {
    const style = document.createElement('style');
    style.textContent = `
      .navbar {
        background-color: #333;
        padding: 1rem;
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
    `;
    document.head.appendChild(style);
  }
}
