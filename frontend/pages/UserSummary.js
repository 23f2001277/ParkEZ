export default {
  name: 'UserSummary',
  data() {
    return {
      summaryData: {},
      loading: false,
      error: null,
      period: '30',
      chart: null,
      pieChart: null
    };
  },
  created() {
    this.loadSummaryData();
  },
  methods: {
    async loadSummaryData() {
      this.loading = true;
      this.error = null;
      try {
        const userStr = localStorage.getItem('user');
        let token = '';
        let userId = '1';
        if (userStr) {
          const user = JSON.parse(userStr);
          token = user.token;
          userId = user.id || user.userId || '1';
        }
        const res = await fetch(`/api/user-summary/${userId}?period=${this.period}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Failed to load summary');
        this.summaryData = await res.json();
        this.$nextTick(() => {
          this.renderBarChart();
          this.renderPieChart();
        });
      } catch (e) {
        this.error = e.message || 'Failed to load summary data';
      } finally {
        this.loading = false;
      }
    },
    formatHours(hours) {
      if (hours < 1) return `${Math.round(hours * 60)}m`;
      if (hours < 24) return `${hours.toFixed(1)}h`;
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    },
    renderBarChart() {
      if (!this.summaryData.recentSessions) return;
      const ctx = document.getElementById('barChart');
      if (!ctx) return;
      if (this.chart) this.chart.destroy();
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.summaryData.recentSessions.map(s => `${s.lotName}(${s.lotAddress})`),
          datasets: [{
            label: 'Cost (₹)',
            data: this.summaryData.recentSessions.map(s => s.cost),
            backgroundColor: '#6366f1'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          }
        }
      });
    },
    renderPieChart() {
      if (!this.summaryData.recentSessions) return;
      const ctx = document.getElementById('pieChart');
      if (!ctx) return;
      if (this.pieChart) this.pieChart.destroy();
      // Pie chart for session status
      const completed = this.summaryData.recentSessions.filter(s => s.status === 'completed').length;
      const ongoing = this.summaryData.recentSessions.length - completed;
      this.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Completed', 'Ongoing'],
          datasets: [{
            data: [completed, ongoing],
            backgroundColor: ['#10b981', '#f59e42']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  },
  watch: {
    summaryData() {
      this.$nextTick(() => {
        this.renderBarChart();
        this.renderPieChart();
      });
    }
  },
  template: `
    <div class="container mt-4">
      <h2 class="mb-4 text-center">User Summary</h2>
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border" role="status"></div>
        <p class="mt-2">Loading summary...</p>
      </div>
      <div v-else-if="error" class="alert alert-danger text-center">{{ error }}</div>
      <div v-else>
        <div class="row mb-4">
          <div class="col-md-3" v-if="summaryData.overview">
            <div class="card text-center mb-3">
              <div class="card-body">
                <div class="mb-2" style="font-size:2rem;">💰</div>
                <h5 class="card-title">Total Spent</h5>
                <p class="card-text fw-bold">₹{{ summaryData.overview.totalExpenditure?.toFixed(2) || 0 }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-3" v-if="summaryData.overview">
            <div class="card text-center mb-3">
              <div class="card-body">
                <div class="mb-2" style="font-size:2rem;">⏱️</div>
                <h5 class="card-title">Total Time</h5>
                <p class="card-text fw-bold">{{ formatHours(summaryData.overview.totalHours || 0) }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-3" v-if="summaryData.overview">
            <div class="card text-center mb-3">
              <div class="card-body">
                <div class="mb-2" style="font-size:2rem;">🚗</div>
                <h5 class="card-title">Sessions</h5>
                <p class="card-text fw-bold">{{ summaryData.overview.totalSessions || 0 }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-3" v-if="summaryData.overview">
            <div class="card text-center mb-3">
              <div class="card-body">
                <div class="mb-2" style="font-size:2rem;">⭐</div>
                <h5 class="card-title">Favorite Spot</h5>
                <p class="card-text fw-bold">{{ summaryData.overview.favoriteSpot || 'N/A' }}</p>
              </div>
            </div>
          </div>
        </div>
        <!-- Charts Section -->
        <div class="row mb-4">
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header text-center fw-bold">Cost per Lot</div>
              <div class="card-body">
                <canvas id="barChart" height="180"></canvas>
              </div>
            </div>
          </div>
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header text-center fw-bold">Session Status</div>
              <div class="card-body">
                <canvas id="pieChart" height="180"></canvas>
              </div>
            </div>
          </div>
        </div>
        <!-- Add more summary tables/charts here as needed -->
        <div v-if="summaryData.recentSessions && summaryData.recentSessions.length">
          <h4 class="mt-4 mb-3">Recent Parking Sessions</h4>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Address</th>
                <th>Duration</th>
                <th>Date</th>
                <th>Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="session in summaryData.recentSessions" :key="session.id">
                <td>
                  <div>
                    <strong>{{ session.lotName }}</strong>
                    <div class="text-muted" style="font-size: 0.95em;">{{ session.lotAddress }} - {{ session.lotPincode }}</div>
                  </div>
                </td>
                <td>{{ formatHours(session.duration) }}</td>
                <td>{{ session.startTime ? new Date(session.startTime).toLocaleString() : '' }}</td>
                <td>₹{{ session.cost?.toFixed(2) }}</td>
                <td>
                  <span v-if="session.status === 'completed'" class="badge bg-success">Completed</span>
                  <span v-else class="badge bg-warning text-dark">Ongoing</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
};