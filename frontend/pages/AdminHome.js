import ViewSpot from '../components/ViewSpot.js';
import OccupiedSpotDetails from '../components/OccupiedSpotDetails.js';

export default {
  name: 'AdminHome',
  components: {
    ViewSpot,
    OccupiedSpotDetails
  },

  data() {
    return {
      parkingLots: [],
      parkingSpots: [],
    };
  },

  async mounted() {
    await this.loadData();
    console.log('AdminHome mounted, components registered:', Object.keys(this.$options.components));
  },

  methods: {
    // Helper method to get token
    getToken() {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          return JSON.parse(userStr).token;
        } catch (error) {
          console.error("Error parsing user token:", error);
          return null;
        }
      }
      return null;
    },

    async loadData() {
      try {
        const token = this.getToken();
        if (!token) {
          console.error("No authentication token found");
          this.$router.push('/login');
          return;
        }

        // Always send the token for protected endpoints
        const lotsResponse = await fetch("/api/parkinglots", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        let lotsData = [];
        if (lotsResponse.ok) {
          lotsData = await lotsResponse.json();
        } else {
          // Handle 401 or other errors
          const errorText = await lotsResponse.text();
          console.error("Failed to fetch lots:", errorText);
          this.parkingLots = [];
          this.parkingSpots = [];
          return;
        }

        let spotsData = [];
        const spotsResponse = await fetch("/api/parkingspots", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (spotsResponse.ok) {
          spotsData = await spotsResponse.json();
        }

        this.parkingSpots = spotsData;
        if (Array.isArray(lotsData)) {
          this.parkingLots = lotsData.map(lot => ({
            ...lot,
            number_of_spots: Number(lot.number_of_spots),
            spots: this.getSpotsForLot(lot.id, spotsData),
            predicted_occupancy: null // For prediction display
          }));
        } else {
          this.parkingLots = [];
        }

        await this.ensureAllSpotsExist();

      } catch (error) {
        console.error("Failed to fetch data:", error);
        this.parkingLots = [];
        this.parkingSpots = [];
      }
    },

    async fetchOccupancyPrediction(lotId) {
      const token = this.getToken();
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      try {
        const res = await fetch(`/api/parkinglots/${lotId}/predict`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Store prediction in the lot object for display
          const lot = this.parkingLots.find(l => l.id === lotId);
          if (lot) {
            lot.predicted_occupancy = data.predicted_occupancy;
          }
        } else {
          console.error("Prediction fetch failed:", await res.text());
        }
      } catch (err) {
        console.error("Prediction fetch error:", err);
      }
    },

    async ensureAllSpotsExist() {
      try {
        console.log('Starting to ensure all spots exist...');
        
        const token = this.getToken();
        console.log('Token:', token ? 'Found' : 'undefined');

        if (!token) {
          console.error("No authentication token available");
          return;
        }

        for (const lot of this.parkingLots) {
          console.log(`Processing lot ${lot.id}: ${lot.prime_location_name}`);
          
          const currentSpots = this.parkingSpots.filter(spot => spot.lot_id === lot.id);
          const currentSpotCount = currentSpots.length;
          const requiredSpotCount = lot.number_of_spots;
          
          console.log(`Lot ${lot.id}: has ${currentSpotCount} spots, needs ${requiredSpotCount}`);
          
          if (currentSpotCount < requiredSpotCount) {
            const spotsToCreate = requiredSpotCount - currentSpotCount;
            console.log(`Need to create ${spotsToCreate} spots for lot ${lot.id}`);
            
            for (let i = 0; i < spotsToCreate; i++) {
              try {
                const spotData = {
                  lot_id: lot.id,
                  status: 'A'
                };
                
                console.log(`Creating spot with data:`, spotData);
                
                // Fixed: Remove undefined variables and use proper URL
                const response = await fetch(`/api/parkingspots`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(spotData)
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  console.error(`Failed to create spot for lot ${lot.id}:`, errorText);
                  throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const result = await response.json();
                console.log(`Successfully created spot:`, result);
                
                // Add the new spot to our local array
                this.parkingSpots.push(result);
                
              } catch (error) {
                console.error(`Error creating spot ${i + 1} for lot ${lot.id}:`, error);
              }
            }
          } else if (currentSpotCount === requiredSpotCount) {
            console.log(`Lot ${lot.id} already has the correct number of spots`);
          } else {
            console.log(`Lot ${lot.id} has too many spots (${currentSpotCount} > ${requiredSpotCount})`);
          }
        }
        
        console.log('Finished ensuring all spots exist');
        
      } catch (error) {
        console.error('Error in ensureAllSpotsExist:', error);
        throw error;
      }
    },

    getSpotsForLot(lotId, allSpots) {
      return allSpots.filter(spot => spot.lot_id === lotId);
    },

    getSpotByPosition(lotId, position) {
      const lotSpots = this.parkingSpots.filter(spot => spot.lot_id === lotId);
      lotSpots.sort((a, b) => a.id - b.id);
      return lotSpots[position - 1];
    },

    isSpotOccupied(lotId, position) {
      const spot = this.getSpotByPosition(lotId, position);
      return spot && spot.status !== 'A';
    },

    handleSpotClick(lotId, position) {
      console.log('AdminHome: Spot clicked', { lotId, position });
      const spot = this.getSpotByPosition(lotId, position);
      if (!spot) {
        alert(`No parking spot found at position ${position} for lot ${lotId}`);
        return;
      }
      console.log('AdminHome: Found spot', spot);

      if (spot.status === 'A') {
        // Redirect to available spot details page
        this.$router.push(`/view-spot/${spot.id}`);
      } else {
        // Redirect to occupied spot details page
        this.$router.push(`/occupied-spot/${spot.id}`);
      }
    },

    editLot(lotId) {
      this.$router.push(`/edit-lot/${lotId}`);
    },

    async deleteLot(lotId) {
      if (confirm("Are you sure you want to delete this lot?")) {
        const token = this.getToken();
        if (!token) {
          alert("You must be logged in as admin to delete a lot.");
          return;
        }

        try {
          const res = await fetch(`/api/parkinglots/${lotId}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });

          const data = await res.json();
          if (!res.ok) {
            alert(data.message || "Failed to delete lot.");
            return;
          }

          await this.loadData();
          alert("Parking lot deleted successfully.");
        } catch (err) {
          console.error("Delete failed:", err);
          alert("Something went wrong while deleting.");
        }
      }
    },

    async refreshLots() {
      await this.loadData();
    }
  },

  template: `
    <div class="container mt-4">
      <h2 class="text-center mb-4">Admin Dashboard - Parking Lots</h2>
      <div class="d-flex justify-content-end mb-3 gap-2">
        <router-link to="/admin-search" class="btn btn-secondary">
          <i class="fas fa-search"></i> Search
        </router-link>
        <router-link to="/admin-summary" class="btn btn-success">
          <i class="fas fa-chart-bar"></i> Summary
        </router-link>
        <router-link to="/registered-users" class="btn btn-info">
          <i class="fas fa-users"></i> Users
        </router-link>
      </div>
      <div class="row">
        <div 
          v-for="lot in parkingLots" 
          :key="lot.id" 
          class="col-md-6 mb-4"
        >
          <div class="card shadow-sm rounded">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between">
                {{ lot.prime_location_name }} - {{ lot.address }} ({{ lot.pincode }})
                <div>
                  <button class="btn btn-sm btn-info me-2" @click="fetchOccupancyPrediction(lot.id)">
                    Predict Occupancy
                  </button>
                  <button class="btn btn-sm btn-warning me-2" @click="editLot(lot.id)">Edit</button>
                  <button class="btn btn-sm btn-danger" @click="deleteLot(lot.id)">Delete</button>
                </div>
              </h5>
              <div v-if="lot.predicted_occupancy">
                <small>
                  Next 3h: {{ lot.predicted_occupancy.join(', ') }}
                </small>
              </div>
              <p class="text-muted">
                (Occupied: {{ lot.spots.filter(s => s.status !== 'A').length }} / {{ lot.number_of_spots }})
              </p>

              <div class="d-flex flex-wrap">
                <div 
                  v-for="n in lot.number_of_spots"
                  :key="'spot-' + lot.id + '-' + n"
                  class="m-1 d-flex align-items-center justify-content-center"
                  :style="{
                    width: '40px',
                    height: '40px',
                    borderRadius: '5px',
                    backgroundColor: isSpotOccupied(lot.id, n) ? '#dc3545' : '#198754',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }"
                  @click="handleSpotClick(lot.id, n)"
                  :title="'Spot ' + n + ' - ' + (isSpotOccupied(lot.id, n) ? 'Occupied' : 'Available')"
                >
                  {{ n }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-4">
        <router-link to="/add-lot" class="btn btn-primary">Add Lot</router-link>
      </div>
    </div>
  `
};