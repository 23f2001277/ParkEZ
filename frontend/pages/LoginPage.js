export default {
  template: `
  <div class="login-container">
    <div class="login-card">    
      <div class="card-header">
        <h2 class="card-title">Welcome Back</h2>
        <p class="card-subtitle">Sign in to your ParkEZ account</p>
      </div>
      
      <div v-if="error" class="alert alert-error">
        <span class="alert-icon">⚠️</span>
        {{ error }}
      </div>
      <div v-if="success" class="alert alert-success">
        <span class="alert-icon">✅</span>
        {{ success }}
      </div>

      <form @submit.prevent="submitLogin" class="login-form">
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <input
            type="email"
            id="email"
            class="form-input"
            v-model="email"
            placeholder="Enter your email"
            required
            autocomplete="username"
          >
        </div>

        <div class="form-group">
          <label for="password" class="form-label">
            Password
            <span class="password-toggle" @click="togglePasswordVisibility">
              {{ showPassword ? '👁️' : '🙈' }}
            </span>
          </label>
          <input
            :type="showPassword ? 'text' : 'password'"
            id="password"
            class="form-input"
            v-model="password"
            placeholder="Enter your password"
            required
            autocomplete="current-password"
          >
        </div>

        <button 
          type="submit" 
          class="btn-submit" 
          :disabled="isSubmitting"
          :class="{ 'loading': isSubmitting }"
        >
          <span v-if="isSubmitting" class="spinner"></span>
          {{ isSubmitting ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <div class="register-link">
        <span>Don't have an account? </span>
        <router-link to="/register" class="link">Sign Up</router-link>
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
      showPassword: false,
      isSubmitting: false,
    };
  },

  methods: {
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },

    async submitLogin() {
      this.error = null;
      this.success = null;
      this.isSubmitting = true;

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
      } finally {
        this.isSubmitting = false;
      }
    },
  },

  mounted() {
    const style = document.createElement('style');
    style.textContent = `
      .login-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
      }

      .login-card {
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        padding: 2.5rem;
        width: 100%;
        max-width: 450px;
        animation: slideUp 0.5s ease;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .card-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .card-title {
        font-size: 2rem;
        font-weight: 700;
        color: #333;
        margin-bottom: 0.5rem;
      }

      .card-subtitle {
        color: #666;
        font-size: 1rem;
        margin: 0;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-label {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .password-toggle {
        cursor: pointer;
        font-size: 1.2rem;
        user-select: none;
      }

      .form-input {
        padding: 0.875rem 1rem;
        border: 2px solid #e1e5e9;
        border-radius: 10px;
        font-size: 1rem;
        transition: all 0.3s ease;
        background: #f8f9fa;
      }

      .form-input:focus {
        outline: none;
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .alert {
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .alert-error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      .alert-success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .alert-icon {
        font-size: 1.2rem;
      }

      .btn-submit {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 10px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .btn-submit:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
      }

      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360px);
        }
      }

      .register-link {
        text-align: center;
        margin-top: 1.5rem;
        color: #666;
      }

      .link {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
      }

      .link:hover {
        text-decoration: underline;
      }

      @media (max-width: 768px) {
        .login-container {
          padding: 1rem;
        }

        .login-card {
          padding: 1.5rem;
        }

        .card-title {
          font-size: 1.75rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
};