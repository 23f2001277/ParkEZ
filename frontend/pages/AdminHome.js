export default {
  data() {
    return {
      parkingLots: []
    };
  },
  async mounted() {
    try {
      const response = await fetch("/api/parkinglots");
      const data = await response.json();
      // Ensure the backend returns: id, prime_location_name, number_of_spots, occupied_spots (array)
      this.parkingLots = data.map(lot => ({
        ...lot,
        occupied_spots: Array.isArray(lot.occupied_spots) ? lot.occupied_spots : [],
        number_of_spots: Number(lot.number_of_spots)
      }))
    } catch (error) {
      console.error("Failed to fetch parking lots:", error);
    }
  },
  methods: {
    viewSpot(lotId, spotId) {
      alert(`Lot ID: ${lotId}, Spot ID: ${spotId} clicked.`);
      // Optionally navigate or open modal to view/delete spot
    },
    editLot(lotId) {
      this.$router.push(`/edit-lot/${lotId}`);
    },
    deleteLot(lotId) {
      if (confirm("Are you sure you want to delete this lot?")) {
        fetch(`/api/parkinglots/${lotId}`, {
          method: "DELETE"
        })
        .then(() => {
          this.parkingLots = this.parkingLots.filter(lot => lot.id !== lotId);
        })
        .catch(err => alert("Failed to delete lot"));
      }
    }
  },
  template: `
    <div class="container mt-4">
      <h2 class="text-center mb-4">Admin Dashboard - Parking Lots</h2>

      <div class="row">
        <div 
          v-for="lot in parkingLots" 
          :key="lot.id" 
          class="col-md-6 mb-4"
        >
          <div class="card shadow-sm rounded">
            <div class="card-body">
              <h5 class="card-title d-flex justify-content-between">
                {{ lot.prime_location_name }}
                <div>
                  <button class="btn btn-sm btn-warning me-2" @click="editLot(lot.id)">Edit</button>
                  <button class="btn btn-sm btn-danger" @click="deleteLot(lot.id)">Delete</button>
                </div>
              </h5>
              <p class="text-muted">
                (Occupied: {{ lot.occupied_spots ? lot.occupied_spots.length : 0}} / {{ lot.number_of_spots || 0 }})
              </p>

              <div class="d-flex flex-wrap">
                <div 
                  v-for="n in lot.number_of_spots"
                  :key="n"
                  class="m-1 d-flex align-items-center justify-content-center"
                  :style="{
                    width: '40px',
                    height: '40px',
                    borderRadius: '5px',
                    backgroundColor: lot.occupied_spots.includes(n) ? '#dc3545' : '#198754',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }"
                  @click="viewSpot(lot.id, n)"
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
