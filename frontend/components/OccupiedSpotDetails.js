export default {
  props: ['id'],
  data() {
    return {
      details: null,
      loading: true,
      error: null
    };
  },
  async mounted() {
    try {
      const userStr = localStorage.getItem('user');
      let token = '';
      if (userStr) token = JSON.parse(userStr).token;
      const res = await fetch(`/api/spotdetails/${this.id}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        this.details = data;
      } else {
        this.error = data.error || 'Failed to load details';
      }
    } catch (e) {
      this.error = 'Failed to load details';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    close() {
      this.$router.push('/admin');
    }
  },
  template: `
    <div style="min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="background:#fff;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,0.13);padding:40px 36px;min-width:340px;max-width:420px;width:100%;">
        <div v-if="loading" style="text-align:center;">
          <div style="width:48px;height:48px;border:5px solid #e2e8f0;border-top:5px solid #667eea;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 18px;"></div>
          <p style="font-size:18px;color:#64748b;">Loading occupied spot details...</p>
        </div>
        <div v-else-if="error" style="text-align:center;">
          <div style="font-size:48px;margin-bottom:18px;">⚠️</div>
          <h3 style="color:#dc2626;margin-bottom:10px;">Error</h3>
          <p style="font-size:17px;color:#64748b;margin-bottom:24px;">{{ error }}</p>
          <button @click="close" style="padding:12px 28px;border-radius:8px;background:#e2e8f0;color:#475569;font-weight:700;border:none;cursor:pointer;">Back</button>
        </div>
        <div v-else>
          <h2 style="margin:0 0 24px 0;font-size:26px;font-weight:700;text-align:center;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Occupied Spot Details</h2>
          <div style="display:flex;flex-direction:column;gap:18px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Spot ID</span>
              <span style="font-weight:600;">#{{ details.id }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Customer ID</span>
              <span style="font-weight:600;">{{ details.customer_id }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Vehicle Number</span>
              <span style="font-weight:600;">{{ details.vehicle_number }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Time In</span>
              <span style="font-weight:600;">{{ details.time_in }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#64748b;font-size:14px;font-weight:700;text-transform:uppercase;">Estimated Cost</span>
              <span style="font-weight:600;">₹{{ details.estimated_cost }}</span>
            </div>
          </div>
          <div style="text-align:center;margin-top:32px;">
            <button @click="close" style="padding:12px 36px;border-radius:10px;background:linear-gradient(135deg,#f8fafc,#e2e8f0);color:#475569;font-weight:700;border:2px solid #cbd5e1;cursor:pointer;font-size:16px;transition:all 0.2s;">Back to Dashboard</button>
          </div>
        </div>
      </div>
      
    </div>
  `
};