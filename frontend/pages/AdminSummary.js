export default {
  name: 'AdminSummary',
  data() {
    return {
      summaryData: {},
      loading: false,
      error: null,
      revenueChart: null,
      parkingChart: null,
    //   userActivityChart: null
    };
  },
  async mounted() {
    console.log('AdminSummary mounted');
    await this.loadSummaryData();
  },
  methods: {
    async loadSummaryData() {
      this.loading = true;
      this.error = null;
      try {
        const userStr = localStorage.getItem('user');
        let token = '';
        if (userStr) {
          const user = JSON.parse(userStr);
          token = user.token;
        }
        const res = await fetch(`/api/admin-summary`, {
          headers: { 
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) throw new Error('Failed to load admin summary');
        this.summaryData = await res.json();
        
        console.log('Summary data loaded:', this.summaryData);
        
        // Wait for DOM update, then render charts
        // Use setTimeout to ensure DOM is fully rendered after v-else shows content
        this.$nextTick(() => {
          console.log('About to render charts');
          setTimeout(() => {
            this.renderRevenueChart();
            this.renderParkingChart();
            // this.renderUserActivityChart();
          }, 100);
        });
      } catch (e) {
        this.error = e.message || 'Failed to load summary data';
        console.error('Error loading summary:', e);
      } finally {
        this.loading = false;
      }
    },
    formatCurrency(amount) {
      if (typeof amount !== 'number') amount = Number(amount) || 0;
      return `₹${amount.toFixed(2)}`;
    },
    renderRevenueChart() {
      console.log('renderRevenueChart called');
      console.log('Revenue data:', this.summaryData.revenueByLot);
      
      if (!this.summaryData.revenueByLot || !this.summaryData.revenueByLot.length) {
        console.log('No revenue data available for chart');
        return;
      }
      
      const ctx = document.getElementById('revenueChart');
      console.log('Revenue canvas element:', ctx);
      
      if (!ctx) {
        console.error('Canvas element revenueChart not found - retrying in 200ms');
        setTimeout(() => this.renderRevenueChart(), 200);
        return;
      }
      
      if (this.revenueChart) {
        console.log('Destroying existing revenue chart');
        this.revenueChart.destroy();
      }
      
      console.log('Creating revenue chart with data:', {
        labels: this.summaryData.revenueByLot.map(lot => lot.lotName),
        data: this.summaryData.revenueByLot.map(lot => lot.revenue)
      });
      
      try {
        this.revenueChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: this.summaryData.revenueByLot.map(lot => lot.lotName),
            datasets: [{
              label: 'Revenue (₹)',
              data: this.summaryData.revenueByLot.map(lot => lot.revenue),
              backgroundColor: [
                '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', 
                '#f59e0b', '#ef4444', '#ec4899', '#84cc16'
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
        console.log('Revenue chart created successfully');
      } catch (error) {
        console.error('Error creating revenue chart:', error);
      }
    },
    renderParkingChart() {
      console.log('renderParkingChart called');
      console.log('Parking data:', this.summaryData.parkingLotStats);
      
      if (!this.summaryData.parkingLotStats || !this.summaryData.parkingLotStats.length) {
        console.log('No parking data available for chart');
        return;
      }
      
      const ctx = document.getElementById('parkingChart');
      console.log('Parking canvas element:', ctx);
      
      if (!ctx) {
        console.error('Canvas element parkingChart not found - retrying in 200ms');
        setTimeout(() => this.renderParkingChart(), 200);
        return;
      }
      
      if (this.parkingChart) {
        console.log('Destroying existing parking chart');
        this.parkingChart.destroy();
      }
      
      try {
        this.parkingChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: this.summaryData.parkingLotStats.map(lot => lot.lotName),
            datasets: [
              {
                label: 'Total Spots',
                data: this.summaryData.parkingLotStats.map(lot => lot.totalSpots),
                backgroundColor: '#e5e7eb'
              },
              {
                label: 'Occupied',
                data: this.summaryData.parkingLotStats.map(lot => lot.occupiedSpots),
                backgroundColor: '#ef4444'
              },
              {
                label: 'Available',
                data: this.summaryData.parkingLotStats.map(lot => lot.availableSpots),
                backgroundColor: '#10b981'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
        console.log('Parking chart created successfully');
      } catch (error) {
        console.error('Error creating parking chart:', error);
      }
    },
    // renderUserActivityChart() {
    //   console.log('renderUserActivityChart called');
    //   console.log('Activity data:', this.summaryData.dailyActivity);
      
    //   if (!this.summaryData.dailyActivity || !this.summaryData.dailyActivity.length) {
    //     console.log('No activity data available for chart - this is expected since backend returns empty array');
    //     return;
    //   }
      
    //   const ctx = document.getElementById('userActivityChart');
    //   console.log('Activity canvas element:', ctx);
      
    //   if (!ctx) {
    //     console.error('Canvas element userActivityChart not found');
    //     return;
    //   }
      
    //   if (this.userActivityChart) {
    //     console.log('Destroying existing activity chart');
    //     this.userActivityChart.destroy();
    //   }
      
    //   try {
    //     this.userActivityChart = new Chart(ctx, {
    //       type: 'line',
    //       data: {
    //         labels: this.summaryData.dailyActivity.map(day => day.date),
    //         datasets: [
    //           {
    //             label: 'New Users',
    //             data: this.summaryData.dailyActivity.map(day => day.newUsers),
    //             borderColor: '#8b5cf6',
    //             backgroundColor: 'rgba(139, 92, 246, 0.1)',
    //             tension: 0.4,
    //             fill: true
    //           },
    //           {
    //             label: 'Sessions',
    //             data: this.summaryData.dailyActivity.map(day => day.sessions),
    //             borderColor: '#06b6d4',
    //             backgroundColor: 'rgba(6, 182, 212, 0.1)',
    //             tension: 0.4,
    //             fill: true
    //           }
    //         ]
    //       },
    //       options: {
    //         responsive: true,
    //         maintainAspectRatio: false,
    //         plugins: {
    //           legend: { position: 'top' }
    //         },
    //         scales: {
    //           y: { beginAtZero: true }
    //         }
    //       }
    //     });
    //     console.log('Activity chart created successfully');
    //   } catch (error) {
    //     console.error('Error creating activity chart:', error);
    //   }
    // }
  },
  beforeDestroy() {
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.parkingChart) this.parkingChart.destroy();
    // if (this.userActivityChart) this.userActivityChart.destroy();
  },
  template: `
    <div class="container-fluid mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">Admin Dashboard</h2>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3">Loading dashboard data...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger text-center">
        <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
      </div>

      <div v-if="!loading && !error">
        <!-- Overview Cards -->
        <div class="row mb-4" v-if="summaryData.overview">
          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <div class="mb-3" style="font-size: 3rem; color: #10b981;">💰</div>
                <h5 class="card-title text-muted">Total Revenue</h5>
                <h3 class="card-text text-success fw-bold">{{ formatCurrency(summaryData.overview.totalRevenue) }}</h3>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <div class="mb-3" style="font-size: 3rem; color: #8b5cf6;">👥</div>
                <h5 class="card-title text-muted">Total Users</h5>
                <h3 class="card-text text-primary fw-bold">{{ summaryData.overview.totalUsers || 0 }}</h3>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <div class="mb-3" style="font-size: 3rem; color: #06b6d4;">🚗</div>
                <h5 class="card-title text-muted">Active Sessions</h5>
                <h3 class="card-text text-info fw-bold">{{ summaryData.overview.activeSessions || 0 }}</h3>
                <small class="text-muted">{{ summaryData.overview.totalSessions || 0 }} total</small>
              </div>
            </div>
          </div>
          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <div class="mb-3" style="font-size: 3rem; color: #f59e0b;">🅿️</div>
                <h5 class="card-title text-muted">Parking Lots</h5>
                <h3 class="card-text text-warning fw-bold">{{ summaryData.overview.totalParkingLots || 0 }}</h3>
                <small class="text-muted">{{ summaryData.overview.totalSpots || 0 }} spots</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="row mb-4">
          <!-- Revenue by Parking Lot -->
          <div class="col-lg-6 mb-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-bottom">
                <h5 class="card-title mb-0">
                  <i class="fas fa-chart-pie me-2 text-primary"></i>
                  Revenue from each Parking Lot
                </h5>
              </div>
              <div class="card-body" style="height: 400px;">
                <canvas id="revenueChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Parking Lot Occupancy -->
          <div class="col-lg-6 mb-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-bottom">
                <h5 class="card-title mb-0">
                  <i class="fas fa-chart-bar me-2 text-success"></i>
                  Summary and occupied parking lots
                </h5>
              </div>
              <div class="card-body" style="height: 400px;">
                <canvas id="parkingChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  `
};