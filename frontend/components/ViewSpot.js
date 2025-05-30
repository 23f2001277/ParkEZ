export default {
  props: ['id'],
  data() {
    return {
      spot: null,
      lot: null,
      loading: true,
      error: null,
      deleting: false
    };
  },
  async mounted() {
    try {
      const userStr = localStorage.getItem('user');
      let token = '';
      if (userStr) token = JSON.parse(userStr).token;
      // Fetch spot
      const res = await fetch(`/api/parkingspots/${this.id}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        this.spot = await res.json();
        // Fetch lot details for this spot
        if (this.spot && this.spot.lot_id) {
          const lotRes = await fetch(`/api/parkinglots/${this.spot.lot_id}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (lotRes.ok) {
            this.lot = await lotRes.json();
          }
        }
      } else {
        this.error = 'Spot not found.';
      }
    } catch (e) {
      this.error = 'Failed to load spot.';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async deleteSpot() {
      const confirmDelete = confirm("Are you sure you want to delete this parking spot?");
      if (!confirmDelete) return;
      this.deleting = true;
      try {
        const userStr = localStorage.getItem('user');
        let token = '';
        if (userStr) token = JSON.parse(userStr).token;
        const res = await fetch(`/api/parkingspots/${this.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (res.ok) {
          alert('Spot deleted successfully.');
          this.$router.push('/admin');
        } else {
          this.deleteMessage = data.message || 'Failed to delete spot.';
        }
      } catch (e) {
        alert('Error deleting spot.');
      } finally {
        this.deleting = false;
      }
    },
    close() {
      this.$router.back();
    },
    getStatusBadgeClass() {
      if (!this.spot) return '';
      switch ((this.spot.status || '').toLowerCase()) {
        case 'available':
        case 'a':
          return 'background:linear-gradient(135deg,#d1fae5,#a7f3d0);color:#065f46;border:2px solid #10b981;';
        case 'occupied':
        case 'o':
          return 'background:linear-gradient(135deg,#fee2e2,#fca5a5);color:#991b1b;border:2px solid #ef4444;';
        case 'reserved':
        case 'r':
          return 'background:linear-gradient(135deg,#dbeafe,#93c5fd);color:#1e40af;border:2px solid #3b82f6;';
        case 'maintenance':
        case 'm':
          return 'background:linear-gradient(135deg,#fef3c7,#fcd34d);color:#92400e;border:2px solid #f59e0b;';
        default:
          return 'background:linear-gradient(135deg,#f1f5f9,#cbd5e1);color:#475569;border:2px solid #64748b;';
      }
    }
  },
  template: `
    <div style="min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 0;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div v-if="loading" style="background:#fff;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,0.13);padding:48px 36px;min-width:340px;text-align:center;">
        <div style="width:48px;height:48px;border:5px solid #e2e8f0;border-top:5px solid #667eea;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 18px;"></div>
        <p style="font-size:18px;color:#64748b;">Loading parking spot details...</p>
      </div>
      <div v-else-if="error" style="background:#fff;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,0.13);padding:48px 36px;min-width:340px;text-align:center;">
        <div style="font-size:48px;margin-bottom:18px;">⚠️</div>
        <h3 style="color:#dc2626;margin-bottom:10px;">Error</h3>
        <p style="font-size:17px;color:#64748b;margin-bottom:24px;">{{ error }}</p>
        <button @click="close" style="padding:12px 28px;border-radius:8px;background:#e2e8f0;color:#475569;font-weight:700;border:none;cursor:pointer;">Back</button>
      </div>
      <div v-else-if="spot" style="background:#fff;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,0.13);padding:0;min-width:340px;max-width:480px;width:100%;">
        <div style="background:linear-gradient(135deg,#1e3a8a 0%,#3730a3 50%,#581c87 100%);color:#fff;padding:28px 32px 18px 32px;border-radius:18px 18px 0 0;display:flex;align-items:center;">
          <h2 style="margin:0;font-size:26px;font-weight:700;width:100%;text-align:center;">Parking Spot Details</h2>
        </div>
        <div style="padding:32px 32px 0 32px;">
          <div style="display:flex;flex-direction:column;gap:18px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Spot ID</span>
              <span style="font-family:'SF Mono','Monaco','Cascadia Code',monospace;font-weight:800;font-size:19px;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">#{{ spot.id }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Status</span>
              <span :style="getStatusBadgeClass()" style="padding:6px 18px;border-radius:18px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(0,0,0,0.07);">{{ spot.status || 'Unknown' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Lot ID</span>
              <span style="font-weight:600;">#{{ spot.lot_id || 'N/A' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Location</span>
              <span style="font-weight:600;">{{ lot && lot.prime_location_name ? lot.prime_location_name : 'N/A' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Address</span>
              <span style="font-weight:600;">{{ lot && lot.address ? lot.address : 'N/A' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Pin Code</span>
              <span style="font-weight:600;">{{ lot && lot.pincode ? lot.pincode : 'N/A' }}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:14px;padding:28px 32px 32px 32px;background:#fff;border-radius:0 0 18px 18px;margin-top:24px;">
          <button 
            @click="deleteSpot" 
            :disabled="deleting"
            style="flex:1;padding:14px 0;border-radius:10px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-weight:700;border:none;cursor:pointer;font-size:16px;transition:all 0.2s;"
          >
            <span v-if="deleting" style="width:18px;height:18px;border:3px solid rgba(255,255,255,0.3);border-top:3px solid #fff;border-radius:50%;display:inline-block;vertical-align:middle;margin-right:8px;animation:spin 1s linear infinite;"></span>
            {{ deleting ? 'Deleting...' : 'Delete Spot' }}
          </button>
          <button @click="close" style="flex:1;padding:14px 0;border-radius:10px;background:linear-gradient(135deg,#f8fafc,#e2e8f0);color:#475569;font-weight:700;border:2px solid #cbd5e1;cursor:pointer;font-size:16px;transition:all 0.2s;">Back</button>
        </div>
      </div>
    </div>
  `
};