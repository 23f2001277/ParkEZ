export default {
  name: 'CustomerHome',

  data() {
    return {
      user: null,
      parkingHistory: [],
      parkingLots: [],
      searchLocation: '',
      searchTerm: '',
      loading: true,
      error: null,
      statusMap: {
        'A': 'Active',
        'C': 'Completed',
        'R': 'Released',
        'O': 'Occupied'
      },
      statusClassMap: {
        'A': 'badge bg-success',
        'C': 'badge bg-secondary',
        'R': 'badge bg-warning',
        'O': 'badge bg-info'
      },
      releaseMessage: '',
      releaseMessageType: '',
      releasingBookingId: null,
      exporting: false,
      csvReady: false,
      csvMessage: "",
      exportTaskId: null,
      exportPollInterval: null
    };
  },

  async mounted() {
    this.loadUser();
    await this.ensureUserDetails();
    await this.loadData();
    this.loading = false;
  },

  // Refresh data when returning from ReleaseSpot
  async activated() {
    // This hook is called when component becomes active
    if (this.$route.query.refreshed !== 'true') {
      await this.refreshData();
    }
  },

  computed: {
    filteredParkingLots() {
      if (!this.searchTerm) return this.parkingLots;
      const searchText = this.searchTerm.toLowerCase();
      return this.parkingLots.filter(lot =>
        lot.prime_location_name.toLowerCase().includes(searchText) ||
        lot.address.toLowerCase().includes(searchText) ||
        lot.pincode.toString().includes(searchText)
      );
    },
    activeStatusKey() {
      return Object.keys(this.statusMap).find(
        key => this.statusMap[key].toLowerCase() === 'active'
      );
    },
    releasedStatusKey() {
      return Object.keys(this.statusMap).find(
        key => this.statusMap[key].toLowerCase() === 'released'
      );
    },
    hasActiveBooking() {
      return this.parkingHistory.some(
        booking => booking.status && booking.status === this.activeStatusKey
      );
    }
  },

  // Watch for route changes to refresh data
  watch: {
    '$route'(to, from) {
      // If coming back from release page, refresh data
      if (from.path && from.path.includes('/release/') && to.path === '/customer') {
        this.refreshData();
      }
    }
  },

  methods: {
     async exportCSV() {
      this.exporting = true;
      this.csvMessage = "Preparing your CSV export...";
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) {
        this.csvMessage = "Please log in to export your data.";
        this.exporting = false;
        return;
      }
      // Trigger async export
      try {
        const res = await fetch('/api/user-csv-export', {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${user.token}`
          }
    });
        if (!res.ok) throw new Error("Failed to start export");
        const data = await res.json();
        this.exportTaskId = data.task_id;
        this.exportPollInterval = setInterval(this.pollExportStatus, 1500);
      } catch (e) {
        this.csvMessage = "Failed to start CSV export.";
        this.exporting = false;
      }
    },
    async pollExportStatus() {
      if (!this.exportTaskId) return;
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      try {
        const res = await fetch(`/api/user-csv-export/${this.exportTaskId}`, {
          headers: {
            "Authorization": `Bearer ${user.token}`
          }
        });
        if (res.status === 200) {
          // CSV is ready, download it
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "my_parking_history.csv";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          clearInterval(this.exportPollInterval);
          this.exporting = false;
          this.csvMessage = "CSV file has been downloaded!";
          this.exportTaskId = null;
        }
        // else: still pending, keep polling
      } catch (e) {
        clearInterval(this.exportPollInterval);
        this.exporting = false;
        this.csvMessage = "Failed to download CSV.";
        this.exportTaskId = null;
      }
    },
    goToSummary(){
      this.$router.push('/user-summary');
    },
    loadUser() {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        this.user = JSON.parse(userStr);
      } else {
        this.$router.push('/login');
      }
    },

    async ensureUserDetails() {
      if (this.user && this.user.token) {
        try {
          const response = await fetch('/customer', {
            headers: {
              'Authorization': `Bearer ${this.user.token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();

            this.user = {
              ...this.user,
              id: userData.id,
              email: userData.email,
              full_name: userData.full_name,
              phone_number: userData.phone_number,
              address: userData.address,
              age: userData.age,
              vehicle_number: userData.vehicle_number
            };

            localStorage.setItem('user', JSON.stringify(this.user));
          } else {
            if (response.status === 401) {
              localStorage.removeItem('user');
              this.$router.push('/login');
            }
          }
        } catch (error) {
          // Silent fail
        }
      }
    },

    async loadData() {
      await Promise.all([
        this.loadParkingHistory(),
        this.loadParkingLots()
      ]);
    },

    async loadParkingHistory() {
      try {
        if (!this.user) return;

        const response = await fetch(`/api/bookings/user/${this.user.id}`, {
          headers: {
            "Authorization": `Bearer ${this.user.token}`
          }
        });

        if (response.ok) {
          this.parkingHistory = await response.json();
          // Sort by created_at descending to show newest first
          this.parkingHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
      } catch (error) {
        console.error('Error loading parking history:', error);
      }
    },

    async loadParkingLots() {
      try {
        const response = await fetch("/api/parkinglots");
        if (response.ok) {
          const lots = await response.json();

          // Process each lot to get real-time availability
          for (let lot of lots) {
            // The API endpoint /api/parkingspots/available returns spots with status 'A' (Available)
            // So this gives us the count of available spots
            const availableCount = await this.getActualAvailableSpots(lot.id);
            
            // Set the values correctly:
            // - total_spots: total spots from lot data (number_of_spots)  
            // - available_spots: current available spots from API call
            lot.total_spots = lot.number_of_spots || 0;
            lot.available_spots = availableCount;
            
            // Debug logging to verify the data
            console.log(`Lot ${lot.id}: Available=${availableCount}, Total=${lot.total_spots}`);
          }

          this.parkingLots = lots;
        }
      } catch (error) {
        console.error('Error loading parking lots:', error);
      }
    },

    async getActualAvailableSpots(lotId) {
      try {
        if (!this.user) return 0;

        const response = await fetch(`/api/parkingspots/available?lot_id=${lotId}`, {
          headers: {
            "Authorization": `Bearer ${this.user.token}`
          }
        });

        if (response.ok) {
          const spots = await response.json();
          return spots.length;
        } else {
          return 0;
        }
      } catch (error) {
        return 0;
      }
    },

    getLocationName(lotId) {
      const lot = this.parkingLots.find(l => l.id === lotId);
      return lot ? lot.prime_location_name : 'Unknown Location';
    },

    getLotAddress(lotId) {
      const lot = this.parkingLots.find(l => l.id === lotId);
      return lot ? lot.address : 'N/A';
    },

    getBookingStatus(booking) {
      if (!booking || !booking.status) return 'Unknown';
      return this.statusMap[booking.status] || booking.status;
    },

    getStatusClass(status) {
      return this.statusClassMap[status] || 'badge bg-primary';
    },

    handleBookClick(lot) {
      if (this.hasActiveBooking) {
        this.releaseMessage = 'You already have a spot currently booked. Please release it before booking another.';
        this.releaseMessageType = 'error';
        return;
      }
      if (!this.canBookLot(lot)) {
        this.releaseMessage = 'No spots available.';
        this.releaseMessageType = 'error';
        return;
      }
      this.releaseMessage = '';
      this.releaseMessageType = '';
      this.navigateToBooking(lot.id);
    },

    navigateToBooking(lotId) {
      this.$router.push(`/book/${lotId}`);
    },

    async navigateToRelease(booking) {
      this.releasingBookingId = booking.id;
      this.releaseMessage = '';
      this.releaseMessageType = '';
      this.$router.push({
        path: `/release/${booking.id}`,
        query: { from: 'customerhome' }
      });
    },

    canBookLot(lot) {
      return !this.hasActiveBooking && lot.available_spots && lot.available_spots > 0;
    },

    formatAvailability(lot) {
      const available = lot.available_spots || 0;
      const total = lot.total_spots || 0;
      return `${available} / ${total}`;
    },

    getAvailabilityClass(lot) {
      const available = lot.available_spots || 0;
      if (available === 0) return 'text-danger';
      if (available <= 2) return 'text-warning';
      return 'text-success';
    },

    async refreshData() {
      this.loading = true;
      this.releaseMessage = '';
      this.releaseMessageType = '';
      await this.loadData();
      this.loading = false;
      this.releasingBookingId = null;
    },

    performSearch() {
      this.searchTerm = this.searchLocation;
    },

    clearSearch() {
      this.searchLocation = '';
      this.searchTerm = '';
    },

    logout() {
      localStorage.removeItem('user');
      this.$router.push('/');
    }
  },

  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-end mb-3">
        <button class="btn btn-outline-success" @click="exportCSV" :disabled="exporting" style="border-radius:20px;">
          <i class="fas fa-file-csv"></i>
          <span v-if="exporting">Exporting...</span>
          <span v-else>Export My Parking History (CSV)</span>
        </button>
      </div>
      <div v-if="csvMessage" class="alert alert-success py-2 px-3 mt-2" style="max-width:320px;font-size:0.95rem;">
        {{ csvMessage }}
      </div>
      <!-- Add Summary Button at the top right -->
      <div class="d-flex justify-content-end mb-3">
        <button class="btn btn-info" @click="goToSummary" style="border-radius:20px;">
          <i class="fas fa-chart-bar me-2"></i>Summary
        </button>
      </div>
    
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading dashboard...</p>
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>User Dashboard</h2>
            <p class="text-muted mb-0" v-if="user && user.full_name">Welcome {{ user.full_name }}!</p>
          </div>
          <div>
            <router-link to="/profile" class="btn btn-outline-primary me-2">Edit Profile</router-link>
            <button class="btn btn-outline-secondary" @click="logout">Logout</button>
          </div>
        </div>

        <!-- Recent Parking History Card -->
        <div class="card mb-4" style="border-radius: 15px; border: 2px solid #28a745;">
          <div class="card-header bg-light" style="border-radius: 13px 13px 0 0;">
            <h5 class="mb-0 text-center">Recent parking history</h5>
          </div>
          <div class="card-body">
            <div v-if="parkingHistory.length > 0">
              <div class="table-responsive">
                <table class="table table-borderless align-middle text-center">
                  <thead>
                    <tr class="border-bottom">
                      <th>ID</th>
                      <th>Location</th>
                      <th>Address</th>
                      <th>Vehicle no.</th>
                      <th>Booking Time/Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="booking in parkingHistory.slice(0, 5)" :key="booking.id" class="border-bottom">
                      <td class="align-middle">{{ booking.id }}</td>
                      <td class="align-middle">{{ getLocationName(booking.lot_id) }}</td>
                      <td class="align-middle">{{ getLotAddress(booking.lot_id) }}</td>
                      <td class="align-middle">{{ user && user.vehicle_number ? user.vehicle_number : 'N/A' }}</td>
                      <td class="align-middle">{{ booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A' }}</td>
                      <td class="align-middle">
                        <span :class="getStatusClass(booking.status)">
                          {{ getBookingStatus(booking) }}
                        </span>
                      </td>
                      <td class="align-middle">
                        <div class="d-flex justify-content-center">
                          <!-- Active booking - show Release button -->
                          <button 
                            v-if="booking.status === activeStatusKey" 
                            class="btn btn-sm btn-danger px-3 me-2"
                            @click="navigateToRelease(booking)"
                            :disabled="releasingBookingId === booking.id"
                            style="border-radius: 20px;"
                          >
                            <span v-if="releasingBookingId === booking.id" class="spinner-border spinner-border-sm me-2" role="status"></span>
                            {{ releasingBookingId === booking.id ? 'Releasing...' : 'Release' }}
                          </button>
                          <!-- Released booking - show Parked Out button -->
                          <button 
                            v-else-if="booking.status === releasedStatusKey" 
                            class="btn btn-sm btn-success px-3"
                            disabled
                            style="border-radius: 20px;"
                          >
                            Parked Out
                          </button>
                          <!-- Other statuses - show Details button -->
                          <button 
                            v-else 
                            class="btn btn-sm btn-outline-info px-3"
                            @click="navigateToRelease(booking)"
                            style="border-radius: 20px;"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <!-- Show release message if any -->
                <div v-if="releaseMessage" :class="['alert', releaseMessageType === 'success' ? 'alert-success' : 'alert-danger']" class="mt-3">
                  {{ releaseMessage }}
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted py-4">
              <i class="fas fa-car fa-2x mb-3"></i>
              <p>No parking history found</p>
            </div>
          </div>
        </div>

        <!-- Search Section -->
        <div class="row mb-3">
          <div class="col-12">
            <div class="d-flex align-items-center">
              <label class="me-3 fw-bold">Search parking :</label>
              <div class="flex-grow-1 d-flex">
                <input
                  type="text"
                  class="form-control me-2"
                  placeholder="Enter location , address or PIN code..."
                  v-model="searchLocation"
                  @keyup.enter="performSearch"
                  style="border-radius: 20px; flex-grow: 1;"
                >
                <button 
                  class="btn btn-primary px-4" 
                  @click="performSearch"
                  style="border-radius: 20px;"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Parking Lots Results -->
        <div class="card" style="border-radius: 15px; border: 2px solid #28a745;">
          <div class="card-header bg-light" style="border-radius: 13px 13px 0 0;">
            <h5 class="mb-0 text-center">Search Results</h5>
          </div>
          <div class="card-body">
            <div v-if="filteredParkingLots.length > 0">
              <div class="table-responsive">
                <table class="table table-borderless align-middle text-center">
                  <thead>
                    <tr class="border-bottom">
                      <th>ID</th>
                      <th>Location</th>
                      <th>Address</th>
                      <th>Availability</th>
                      <th class="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="lot in filteredParkingLots" :key="lot.id" class="border-bottom">
                      <td class="align-middle">{{ lot.id }}</td>
                      <td class="align-middle">
                        <strong>{{ lot.prime_location_name }}</strong>
                        <br>
                        <small class="text-muted">PIN: {{ lot.pincode }}</small>
                      </td>
                      <td class="align-middle">{{ lot.address }}</td>
                      <td class="align-middle">
                        <span :class="getAvailabilityClass(lot)" class="fw-bold">
                          {{ formatAvailability(lot) }}
                        </span>
                      </td>
                      <td class="align-middle text-center">
                        <div class="d-flex justify-content-center">
                          <button 
                            class="btn btn-success px-4"
                            @click="handleBookClick(lot)"
                            :disabled="!lot.available_spots || lot.available_spots === 0"
                            style="border-radius: 20px;"
                          >
                            {{ lot.available_spots && lot.available_spots > 0 ? 'Book' : 'Full' }}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else-if="parkingLots.length === 0" class="text-center text-muted py-4">
              <i class="fas fa-map-marker-alt fa-2x mb-3"></i>
              <p>No parking lots available</p>
            </div>
            <div v-else class="text-center text-muted py-4">
              <i class="fas fa-search fa-2x mb-3"></i>
              <p>No parking lots match your search criteria</p>
              <button class="btn btn-outline-primary" @click="clearSearch">Clear Search</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};