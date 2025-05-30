export default {
  template: `
  <div class="loginpage" style="display: flex; justify-content: center; padding-top: 50px;">
    <div class="login-container" style="width: 400px; border: 1px solid #ccc; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); background-color: #fff;">
      <form @submit.prevent="submitForm">
        <header style="font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px;">Your Profile</header>

        <div v-if="message" :class="['alert', messageType]" style="margin-bottom: 15px;">{{ message }}</div>

        <div class="mb-3" style="margin-bottom: 15px;">
          <label for="email" class="form-label">Email address</label>
          <input type="email" class="form-control" id="email" v-model="email">
        </div>
        <div class="mb-3" style="margin-bottom: 15px;">
          <label for="password" class="form-label">Password</label>
          <input type="password" class="form-control" id="password" v-model="password" placeholder="Leave blank to keep current password">
        </div>
        <div class="mb-3" style="margin-bottom: 15px;">
          <label for="full_name" class="form-label">Full Name</label>
          <input type="text" class="form-control" id="full_name" v-model="full_name">
        </div>
        <div class="mb-3" style="margin-bottom: 15px;">
          <label for="phone_number" class="form-label">Phone Number</label>
          <input type="tel" class="form-control" id="phone_number" v-model="phone_number">
        </div>
        <div class="mb-3" style="margin-bottom: 15px;">
          <label for="vehicle_number" class="form-label">Vehicle Number</label>
          <input type="text" class="form-control" id="vehicle_number" v-model="vehicle_number">
        </div>
        <div class="mb-3" style="margin-bottom: 15px;">
          <label for="address" class="form-label">Address</label>
          <textarea class="form-control" id="address" v-model="address" rows="2"></textarea>
        </div>
        <div class="mb-3" style="margin-bottom: 25px;">
          <label for="age" class="form-label">Age</label>
          <input type="number" class="form-control" id="age" v-model="age">
        </div>

        <div style="display: flex; justify-content: space-between;">
          <button type="submit" class="btn btn-primary" style="width: 48%;">Save Changes</button>
          <button type="button" class="btn btn-secondary" style="width: 48%;" @click="cancelChanges">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  `,
  data() {
    return {
      email: '',
      password: '',
      full_name: '',
      phone_number: '',
      vehicle_number: '',
      address: '',
      age: '',
      response: {},
      message: '',
      messageType: '' // 'alert-success' or 'alert-danger'
    };
  },
  methods: {
    async submitForm() {
      try {
        const res = await fetch(location.origin + '/api/profile/' + this.$store.state.user_id, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.$store.state.auth_token
          },
          body: JSON.stringify({
            email: this.email || this.response.email,
            password: this.password,
            full_name: this.full_name || this.response.full_name,
            phone_number: this.phone_number || this.response.phone_number,
            vehicle_number: this.vehicle_number || this.response.vehicle_number,
            address: this.address || this.response.address,
            age: this.age || this.response.age
          })
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        this.message = 'Profile updated successfully!';
        this.messageType = 'alert-success';

        setTimeout(() => this.$router.push('/customer'), 2000);

      } catch (error) {
        this.message = 'Failed to update profile: ' + error.message;
        this.messageType = 'alert-danger';
      }
    },

    async fetchData() {
      try {
        const res = await fetch(location.origin + '/api/profile/' + this.$store.state.user_id, {
          headers: {
            'Authorization': 'Bearer ' + this.$store.state.auth_token
          }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        this.response = data;

        this.email = data.email || '';
        this.full_name = data.full_name || '';
        this.phone_number = data.phone_number ? String(data.phone_number) : '';
        this.vehicle_number = data.vehicle_number || '';
        this.address = data.address || '';
        this.age = data.age ? String(data.age) : '';

      } catch (error) {
        this.message = 'Error fetching profile: ' + error.message;
        this.messageType = 'alert-danger';
        console.error('Error fetching profile:', error);
      }
    },

    cancelChanges() {
      this.$router.push('/customer');
    }
  },
  mounted() {
    this.fetchData();
    console.log('Stored token:', this.$store.state.auth_token);
  }
};