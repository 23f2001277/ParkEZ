export default {
  template: `
  <div class="d-flex justify-content-center align-items-center vh-100" style="margin-top: 5vh">
    <div class="card shadow-lg p-3 mb-5 bg-white rounded" style="width: 30rem;">
      <h2 class="card-title text-center p-2">Login</h2>

      <div v-if="error" class="text-danger text-center mb-2">{{ error }}</div>
      <div v-if="success" class="text-success text-center mb-2">{{ success }}</div>

      <form @submit.prevent="submitLogin">
        <div class="form-group mb-3">
          <label for="email" class="form-label">Email address</label>
          <input
            type="email"
            id="email"
            class="form-control"
            v-model="email"
            required
            autocomplete="username"
          >
        </div>

        <div class="form-group mb-3">
          <label for="password" class="form-label">Password</label>
          <input
            type="password"
            id="password"
            class="form-control"
            v-model="password"
            required
            autocomplete="current-password"
          >
        </div>

        <div class="text-center">
          <button type="submit" class="btn btn-outline-primary w-60 px">Login</button>
        </div>
      </form>

      <div class="mt-3 text-center">
        <span>Don't have an account? </span>
        <router-link to="/register" class="text-primary text-decoration-none">Sign Up</router-link>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      email: '',
      password: '',
      error: null,
      success: null,
    };
  },

  methods: {
    async submitLogin() {
      this.error = null;
      this.success = null;

      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password }),
        });

        const data = await res.json();

        if (res.ok) {
          this.success = "Login successful! Redirecting...";

          localStorage.setItem('user', JSON.stringify(data));
          this.$store.commit('setUser', data);

          setTimeout(() => {
            if (data.roles === 'admin') {
              this.$router.push('/admin');
            } else if (data.roles === 'user') {
              this.$router.push('/customer');
            } else {
              this.error = "Unknown role: " + data.roles;
              this.success = null;
            }
          }, 2000);
        } else {
          this.error = data.message || "Login failed.";
        }
      } catch (err) {
        this.error = "Something went wrong. Please try again later.";
      }
    },
  },
};