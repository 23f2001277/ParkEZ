export default {
  name: 'AdminSearch',
  data() {
    return {
      lots: [],
      searchType: 'all',
      searchString: '',
      filteredLots: [],
      searched: false // Add searched flag
    };
  },
  async mounted() {
    await this.fetchLots();
  },
  methods: {
    async fetchLots() {
      try {
        const res = await fetch('/api/parkinglots');
        this.lots = await res.json();
        this.filteredLots = [];
        this.searched = false;
      } catch (e) {
        this.lots = [];
        this.filteredLots = [];
        this.searched = false;
      }
    },
    handleSearch() {
      let filtered = this.lots;
      const str = this.searchString.trim().toLowerCase();
      if (this.searchType !== 'all') {
        filtered = filtered.filter(lot => {
          if (this.searchType === 'name')
            return lot.prime_location_name.toLowerCase().includes(str);
          if (this.searchType === 'address')
            return lot.address.toLowerCase().includes(str);
          if (this.searchType === 'pincode')
            return String(lot.pincode).includes(str);
          return true;
        });
      } else if (str) {
        filtered = filtered.filter(lot =>
          lot.prime_location_name.toLowerCase().includes(str) ||
          lot.address.toLowerCase().includes(str) ||
          String(lot.pincode).includes(str)
        );
      }
      this.filteredLots = filtered;
      this.searched = true; // Set searched to true after search
    }
  },
  template: `
    <div class="container mt-4">
      <h2 class="mb-4 text-center">Search Parking Lots</h2>
      <div class="row mb-3">
        <div class="col-md-3">
          <select v-model="searchType" class="form-select">
            <option value="all">All Fields</option>
            <option value="name">Lot Name</option>
            <option value="address">Address</option>
            <option value="pincode">Pincode</option>
          </select>
        </div>
        <div class="col-md-6">
          <input v-model="searchString" type="text" class="form-control" placeholder="Enter search text..." />
        </div>
        <div class="col-md-3 text-end">
          <button class="btn btn-primary" @click="handleSearch">
            <i class="fas fa-search"></i> Search
          </button>
        </div>
      </div>
      <div v-if="searched">
        <div v-if="filteredLots.length">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Lot Name</th>
                <th>Address</th>
                <th>Pincode</th>
                <th>Total Spots</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lot in filteredLots" :key="lot.id">
                <td>{{ lot.prime_location_name }}</td>
                <td>{{ lot.address }}</td>
                <td>{{ lot.pincode }}</td>
                <td>{{ lot.number_of_spots }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="alert alert-warning text-center">
          No lots found.
        </div>
      </div>
    </div>
  `
};