export default {
  name: 'ReleaseSpot',
  
  data() {
    return {
      user: null,
      booking: null,
      lot: null,
      releaseForm: {
        spot_id: '',
        vehicle_number: '',
        parked_at: '',        // <-- Added field
        parking_time: '',
        releasing_time: '',
        total_cost: ''
      },
      loading: true,
      processing: false,
      error: null,
      bookingId: null,
      releaseMessage: '',
      releaseMessageType: '', // 'success' | 'error'
      redirecting: false
    };
  },

  async mounted() {
    this.bookingId = this.$route.params.id;
    this.loadUser();
    await this.loadBookingDetails();
    this.loading = false;
  },

  methods: {
    loadUser() {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        this.user = JSON.parse(userStr);
      } else {
        this.$router.push('/login');
      }
    },

    async loadBookingDetails() {
      try {
        if (!this.user || !this.bookingId) return;
        
        const response = await fetch(`/api/bookings/${this.bookingId}`, {
          headers: {
            "Authorization": `Bearer ${this.user.token}`
          }
        });
        
        if (response.ok) {
          this.booking = await response.json();
          await this.loadLotDetails();
          this.populateReleaseForm();
        } else {
          this.error = "Failed to load booking details";
        }
      } catch (error) {
        this.error = "An error occurred while loading booking details";
      }
    },

    async loadLotDetails() {
      let lotId = this.booking.lot_id || (this.booking.spot && this.booking.spot.lot_id);
      if (!lotId) {
        this.lot = { price: 0 };
        return;
      }
      try {
        const response = await fetch(`/api/parkinglots/${lotId}`, {
          headers: {
            "Authorization": `Bearer ${this.user.token}`
          }
        });
        if (response.ok) {
          this.lot = await response.json();
        } else {
          this.lot = { price: 0 };
        }
      } catch (e) {
        this.lot = { price: 0 };
      }
    },

    populateReleaseForm() {
      if (this.booking) {
        this.releaseForm.spot_id = this.booking.spot_id || '';
        this.releaseForm.vehicle_number = this.booking.vehicle_number || '';
        this.releaseForm.parked_at = this.booking.created_at
          ? new Date(this.booking.created_at).toLocaleString()
          : '';
        this.calculateParkingDetails();
      }
    },

    calculateParkingDetails() {
      const hourlyRate = this.lot && this.lot.price ? this.lot.price : 0;
      try {
        const startTime = new Date(this.booking.created_at);
        const currentTime = new Date();
        const diffHours = Math.ceil((currentTime - startTime) / (1000 * 60 * 60));
        this.releaseForm.parking_time = `${diffHours} hours`;
        this.releaseForm.releasing_time = currentTime.toLocaleString();
        const parkingCost = diffHours * hourlyRate;
        this.releaseForm.total_cost = `₹${parkingCost.toFixed(2)}`;
      } catch (error) {
        this.releaseForm.parking_time = 'N/A';
        this.releaseForm.releasing_time = new Date().toLocaleString();
        this.releaseForm.total_cost = '₹0.00';
      }
    },

    async releaseSpot() {
      if (!this.booking || this.processing) return;
      this.processing = true;
      this.releaseMessage = '';
      this.releaseMessageType = '';
      
      try {
        const response = await fetch(`/api/bookings/${this.booking.id}/release`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.user.token}`
          },
          body: JSON.stringify({
            status: 'R',
            total_cost: this.releaseForm.total_cost.replace(/[^\d.]/g, ''),
            released_at: new Date().toISOString()
          })
        });

        if (response.ok) {
          this.releaseMessage = 'Parking spot released successfully! Redirecting...';
          this.releaseMessageType = 'success';
          this.redirecting = true;
          
          // Wait a moment to show the success message, then redirect
          setTimeout(() => {
            // Force refresh of customer home by adding timestamp
            this.$router.push({
              path: '/customer',
              query: { 
                refresh: Date.now(),
                from: 'release'
              }
            });
          }, 2000);
        } else {
          const errorData = await response.json();
          this.releaseMessage = errorData.message || 'Failed to release parking spot';
          this.releaseMessageType = 'error';
        }
      } catch (error) {
        console.error('Release error:', error);
        this.releaseMessage = 'Something went wrong while releasing the parking spot';
        this.releaseMessageType = 'error';
      } finally {
        this.processing = false;
      }
    },

    cancelRelease() {
      this.$router.push('/customer');
    },

    goBack() {
      // Go back to customer home with refresh parameter
      this.$router.push({
        path: '/customer',
        query: { refresh: Date.now() }
      });
    }
  },

  template: `
    <div class="container mt-4">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading booking details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Error!</h4>
        <p>{{ error }}</p>
        <hr>
        <button class="btn btn-outline-danger" @click="goBack">Go Back</button>
      </div>

      <!-- Release Form -->
      <div v-else class="row justify-content-center">
        <div class="col-md-6">
          <div class="card" style="border-radius: 15px; border: 2px solid #ffc107; background-color: #fff8dc;">
            <div class="card-header text-center" style="background-color: #ffc107; border-radius: 13px 13px 0 0;">
              <h4 class="mb-0" style="color: #000;">Release the parking spot</h4>
            </div>
            <div class="card-body p-4">
              <form @submit.prevent="releaseSpot">
                <!-- Spot ID -->
                <div class="mb-3 d-flex align-items-center">
                  <label class="form-label me-3 mb-0" style="min-width: 140px; font-weight: bold;">Spot_ID:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="releaseForm.spot_id"
                    readonly
                    style="border-radius: 20px; background-color: #f8f9fa;"
                  >
                </div>

                <!-- Vehicle Number -->
                <div class="mb-3 d-flex align-items-center">
                  <label class="form-label me-3 mb-0" style="min-width: 140px; font-weight: bold;">Vehicle Number:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="releaseForm.vehicle_number"
                    readonly
                    style="border-radius: 20px; background-color: #f8f9fa;"
                  >
                </div>

                <!-- When Parked (New Field) -->
                <div class="mb-3 d-flex align-items-center">
                  <label class="form-label me-3 mb-0" style="min-width: 140px; font-weight: bold;">Parked At:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="releaseForm.parked_at"
                    readonly
                    style="border-radius: 20px; background-color: #f8f9fa;"
                  >
                </div>

                <!-- Parking Time -->
                <div class="mb-3 d-flex align-items-center">
                  <label class="form-label me-3 mb-0" style="min-width: 140px; font-weight: bold;">Total Parking Time:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="releaseForm.parking_time"
                    readonly
                    style="border-radius: 20px; background-color: #f8f9fa;"
                  >
                  <span class="ms-2 text-muted small">hours(s)</span>
                </div>

                <!-- Releasing Time -->
                <div class="mb-3 d-flex align-items-center">
                  <label class="form-label me-3 mb-0" style="min-width: 140px; font-weight: bold;">Releasing Time:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="releaseForm.releasing_time"
                    readonly
                    style="border-radius: 20px; background-color: #f8f9fa;"
                  >
                </div>

                <!-- Total Cost -->
                <div class="mb-4 d-flex align-items-center">
                  <label class="form-label me-3 mb-0" style="min-width: 140px; font-weight: bold;">Total cost:</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="releaseForm.total_cost"
                    readonly
                    style="border-radius: 20px; background-color: #f8f9fa; font-weight: bold; color: #e74c3c;"
                  >
                </div>

                <!-- Message Box -->
                <div v-if="releaseMessage" :class="['alert', releaseMessageType === 'success' ? 'alert-success' : 'alert-danger']" class="mt-3">
                  <div v-if="releaseMessageType === 'success'" class="d-flex align-items-center">
                    <i class="fas fa-check-circle me-2"></i>
                    {{ releaseMessage }}
                  </div>
                  <div v-else class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    {{ releaseMessage }}
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex justify-content-center gap-3 mt-4">
                  <button 
                    type="submit" 
                    class="btn btn-primary px-4 py-2"
                    :disabled="processing || releaseMessageType === 'success' || redirecting"
                    style="border-radius: 25px; min-width: 100px;"
                  >
                    <span v-if="processing" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <span v-if="redirecting">
                      <i class="fas fa-check me-2"></i>
                      Success
                    </span>
                    <span v-else-if="processing">Releasing...</span>
                    <span v-else>Release</span>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-secondary px-4 py-2"
                    @click="cancelRelease"
                    :disabled="processing || redirecting"
                    style="border-radius: 25px; min-width: 100px;"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Additional Info -->
          <div class="mt-3 text-center">
            <small class="text-muted">
              <i class="fas fa-info-circle me-1"></i>
              Parking rate: ₹{{ lot && lot.price ? lot.price : 0 }}/hour
            </small>
          </div>
        </div>
      </div>
    </div>
  `
};