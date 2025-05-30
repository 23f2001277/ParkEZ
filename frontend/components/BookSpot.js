export default {
  name: 'BookSpot',

  data() {
    return {
      user: null,
      lot: null,
      availableSpots: [],
      assignedSpot: null,
      vehicleNumber: '',
      loading: true,
      error: null,
      booking: false,
      bookingMessage: '',      // For success/info/error messages
      bookingMessageType: ''   // 'success' | 'error'
    };
  },

  async mounted() {
    // Get lotId from route params
    let lotId = this.$route.params.lotId || this.$route.params.id;
    if (!lotId) {
      lotId = this.$route.query.lotId || this.$route.query.id;
    }
    if (!lotId) {
      this.error = 'No lot ID provided. Please select a parking lot from the dashboard.';
      this.loading = false;
      return;
    }

    try {
      this.loadUser();
      if (!this.user) {
        return this.$router.push('/login');
      }
      await this.loadLot(lotId);
      await this.loadAvailableSpots(lotId);
      if (this.availableSpots.length > 0) {
        this.assignedSpot = this.availableSpots[0];
      }
      this.vehicleNumber = this.user.vehicle_number || '';
    } catch (error) {
      this.error = 'Failed to load booking page: ' + error.message;
    } finally {
      this.loading = false;
    }
  },

  computed: {
    canBook() {
      return this.assignedSpot && this.vehicleNumber && this.vehicleNumber.trim() && !this.booking;
    }
  },

  methods: {
    loadUser() {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (e) {
          this.user = null;
        }
      }
    },

    async loadLot(id) {
      try {
        const response = await fetch(`/api/parkinglots/${id}`, {
          headers: {
            'Authorization': `Bearer ${this.user.token}`
          }
        });
        if (response.ok) {
          this.lot = await response.json();
        } else {
          this.error = `Failed to load parking lot (Status: ${response.status})`;
        }
      } catch (err) {
        this.error = 'Network error while loading parking lot';
      }
    },

    async loadAvailableSpots(lotId) {
      try {
        const response = await fetch(`/api/parkingspots/available`, {
          headers: {
            'Authorization': `Bearer ${this.user.token}`
          }
        });
        if (response.ok) {
          const allAvailableSpots = await response.json();
          this.availableSpots = allAvailableSpots.filter(spot => spot.lot_id == lotId);
        }
      } catch (err) {
        // Silent fail
      }
    },

    async bookSpot() {
      this.bookingMessage = '';
      this.bookingMessageType = '';
      if (!this.assignedSpot || !this.vehicleNumber) {
        this.bookingMessage = "Vehicle number is required";
        this.bookingMessageType = "error";
        return;
      }

      this.booking = true;

      try {
        const bookingData = {
          spot_id: this.assignedSpot.id,
          lot_id: this.lot.id,
          user_id: this.user.id,
          vehicle_number: this.vehicleNumber.trim()
        };

        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.user.token}`
          },
          body: JSON.stringify(bookingData)
        });

        if (response.ok) {
          const result = await response.json();
          this.bookingMessage = 'Parking spot booking successful!';
          this.bookingMessageType = 'success';
          // Optionally, redirect after a short delay
          setTimeout(() => {
            this.$router.push('/customer');
          }, 1500);
        } else {
          const errorResponse = await response.json();
          this.bookingMessage = errorResponse.error || errorResponse.message || 'Parking spot booking failed';
          this.bookingMessageType = 'error';
        }
      } catch (err) {
        this.bookingMessage = "Network error occurred. Please try again.";
        this.bookingMessageType = "error";
      } finally {
        this.booking = false;
      }
    }
  },

  template: `
    <div class="container mt-4">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading booking information...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger">
        <strong>Error:</strong> {{ error }}
        <br><br>
        <router-link to="/customer" class="btn btn-secondary">Back to Dashboard</router-link>
      </div>
      
      <!-- Main Booking Form -->
      <div v-else class="card" style="max-width: 500px; margin: 0 auto;">
        <div class="card-header bg-warning text-center">
          <h4 class="mb-0">Book the parking spot</h4>
        </div>
        <div class="card-body">
          <!-- Spot ID (Auto-assigned) -->
          <div class="mb-3">
            <label class="form-label"><strong>Spot_ID:</strong></label>
            <input 
              type="text" 
              class="form-control" 
              :value="assignedSpot ? assignedSpot.id : 'No spots available'" 
              readonly 
            />
          </div>

          <!-- Lot ID -->
          <div class="mb-3">
            <label class="form-label"><strong>Lot_ID:</strong></label>
            <input 
              type="text" 
              class="form-control" 
              :value="lot ? lot.id : ''" 
              readonly 
            />
          </div>

          <!-- User ID -->
          <div class="mb-3">
            <label class="form-label"><strong>User_ID:</strong></label>
            <input 
              type="text" 
              class="form-control" 
              :value="user ? user.id : ''" 
              readonly 
            />
          </div>

          <!-- Vehicle Number -->
          <div class="mb-4">
            <label class="form-label"><strong>Vehicle Number:</strong></label>
            <input 
              type="text" 
              class="form-control" 
              v-model="vehicleNumber" 
              placeholder="Enter vehicle number"
              :disabled="booking"
            />
          </div>

          <!-- Booking Message Box -->
          <div v-if="bookingMessage" :class="['alert', bookingMessageType === 'success' ? 'alert-success' : 'alert-danger']" class="mt-3">
            {{ bookingMessage }}
          </div>

          <!-- Action Buttons -->
          <div class="d-flex justify-content-center gap-3">
            <button 
              class="btn btn-primary px-4" 
              @click="bookSpot"
              :disabled="!canBook"
            >
              <span v-if="booking" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ booking ? 'Reserving...' : 'Reserve' }}
            </button>
            <button 
              class="btn btn-secondary px-4" 
              @click="$router.push('/customer')"
              :disabled="booking"
            >
              Cancel
            </button>
          </div>

          <!-- No spots available message -->
          <div v-if="!assignedSpot && availableSpots.length === 0" class="alert alert-warning mt-3">
            <i class="fas fa-exclamation-triangle"></i>
            No available spots found for this location.
          </div>

          <!-- Assigned spot info -->
          <div v-if="assignedSpot" class="alert alert-info mt-3">
            <small>
              <strong>Assigned Spot:</strong> Spot #{{ assignedSpot.id }} 
              <br>
              <strong>Location:</strong> {{ lot ? lot.prime_location_name + ' - ' + lot.address : '' }}
            </small>
          </div>
        </div>
      </div>
    </div>
  `
};