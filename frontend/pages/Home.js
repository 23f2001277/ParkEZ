const Home = {
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">Find Your Perfect Parking Spot</h1>
            <p class="hero-subtitle">ParkEZ makes parking simple, fast, and stress-free. Discover available spots near you in real-time.</p>
            <div class="hero-buttons">
              <button class="btn btn-primary">Find Parking Now</button>
              <button class="btn btn-secondary">Learn More</button>
            </div>
          </div>
          <div class="hero-image">
            <div class="parking-illustration">
              🚗 🏢 🅿️
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="container">
          <h2 class="section-title">Why Choose ParkEZ?</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3>Real-Time Availability</h3>
              <p>See available parking spots in real-time with live updates</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💰</div>
              <h3>Best Prices</h3>
              <p>Compare prices and find the most affordable parking options</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h3>Easy Booking</h3>
              <p>Reserve your spot with just a few taps on your phone</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3>Secure Payment</h3>
              <p>Safe and secure payment processing for peace of mind</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">10,000+</div>
              <div class="stat-label">Parking Spots</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">50,000+</div>
              <div class="stat-label">Happy Users</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">500+</div>
              <div class="stat-label">Cities Covered</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">24/7</div>
              <div class="stat-label">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta">
        <div class="container">
          <div class="cta-content">
            <h2>Ready to Park Smarter?</h2>
            <p>Join thousands of drivers who have made parking hassle-free with ParkEZ</p>
            <router-link to="/register" class="btn btn-primary btn-large">Get Started Today</router-link>
          </div>
        </div>
      </section>
    </div>
  `,
  mounted() {
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .home-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      /* Hero Section */
      .hero {
        padding: 4rem 2rem;
        min-height: 80vh;
        display: flex;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        position: relative;
        overflow: hidden;
      }

      .hero::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        opacity: 0.3;
      }

      .hero-content {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        align-items: center;
        position: relative;
        z-index: 1;
      }

      .hero-title {
        font-size: 3.5rem;
        font-weight: 800;
        line-height: 1.2;
        margin-bottom: 1.5rem;
        background: linear-gradient(45deg, #fff, #f0a500);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-subtitle {
        font-size: 1.25rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        opacity: 0.9;
      }

      .hero-buttons {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .parking-illustration {
        font-size: 8rem;
        text-align: center;
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }

      /* Buttons */
      .btn {
        padding: 1rem 2rem;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
        text-align: center;
      }

      .btn-primary {
        background: linear-gradient(45deg, #f0a500, #ff6b35);
        color: white;
        box-shadow: 0 4px 15px rgba(240, 165, 0, 0.4);
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(240, 165, 0, 0.6);
      }

      .btn-secondary {
        background: transparent;
        color: white;
        border: 2px solid white;
      }

      .btn-secondary:hover {
        background: white;
        color: #667eea;
        transform: translateY(-2px);
      }

      .btn-large {
        padding: 1.25rem 3rem;
        font-size: 1.2rem;
      }

      /* Container */
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
      }

      /* Features Section */
      .features {
        padding: 5rem 0;
        background: white;
      }

      .section-title {
        text-align: center;
        font-size: 2.5rem;
        margin-bottom: 3rem;
        color: #333;
        font-weight: 700;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
      }

      .feature-card {
        background: white;
        padding: 2.5rem 2rem;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        border: 1px solid #f0f0f0;
      }

      .feature-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }

      .feature-icon {
        font-size: 3rem;
        margin-bottom: 1.5rem;
      }

      .feature-card h3 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        color: #333;
        font-weight: 600;
      }

      .feature-card p {
        color: #666;
        line-height: 1.6;
      }

      /* Stats Section */
      .stats {
        padding: 4rem 0;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 2rem;
        text-align: center;
      }

      .stat-number {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
      }

      .stat-label {
        font-size: 1.1rem;
        opacity: 0.9;
      }

      /* CTA Section */
      .cta {
        padding: 4rem 0;
        background: #333;
        color: white;
        text-align: center;
      }

      .cta-content h2 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        font-weight: 700;
      }

      .cta-content p {
        font-size: 1.2rem;
        margin-bottom: 2rem;
        opacity: 0.9;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .hero-content {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .hero-title {
          font-size: 2.5rem;
        }

        .hero-subtitle {
          font-size: 1.1rem;
        }

        .parking-illustration {
          font-size: 5rem;
        }

        .section-title {
          font-size: 2rem;
        }

        .features-grid {
          grid-template-columns: 1fr;
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .btn {
          padding: 0.875rem 1.5rem;
          font-size: 1rem;
        }
      }

      @media (max-width: 480px) {
        .hero {
          padding: 2rem 1rem;
        }

        .hero-title {
          font-size: 2rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }
};
export default Home;