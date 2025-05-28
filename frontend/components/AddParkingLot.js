const styles = `
  * { box-sizing: border-box; font-family: Arial, sans-serif; }
  .form-container {
    width: 400px; padding: 20px; margin: 10px auto;
    border: 2px solid #ccc; border-radius: 10px; text-align: center;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  }
  h2 { color: #000; margin-bottom: 20px; }
  .form-group { margin-bottom: 15px; text-align: left; }
  label { display: block; font-weight: bold; margin-bottom: 5px; }
  input, textarea {
    width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 5px;
  }
  .button-group {
    display: flex; justify-content: space-between; margin-top: 20px;
  }
  .button {
    width: 48%; padding: 10px; color: white; border: none;
    border-radius: 5px; cursor: pointer; font-size: 16px;
  }
  .add-button { background-color: #2980b9; }
  .cancel-button { background-color: #bdc3c7; }
  .message {
    margin-top: 15px; padding: 10px; border-radius: 5px;
    font-weight: bold;
  }
  .success { background-color: #d4edda; color: #155724; }
  .error { background-color: #f8d7da; color: #721c24; }
  .warning { background-color: #fff3cd; color: #856404; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default {
  template: `
    <div class="form-container">
      <h2>Add Parking Lot</h2>
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="prime-location">Prime Location Name:</label>
          <input type="text" id="prime_location_name" v-model="prime_location_name" required>
        </div>
        <div class="form-group">
          <label for="address">Address:</label>
          <textarea id="address" v-model="address" rows="3" required></textarea>
        </div>
        <div class="form-group">
          <label for="pincode">Pincode:</label>
          <input type="text" id="pincode" v-model="pincode" required>
        </div>
        <div class="form-group">
          <label for="price-per-hour">Price (Per Hour):</label>
          <input type="number" id="price" v-model="price" required>
        </div>
        <div class="form-group">
          <label for="max-spots">Max Spots Available:</label>
          <input type="number" id="number_of_spots" v-model="number_of_spots" required>
        </div>
        <div class="button-group">
          <button type="submit" class="button add-button">Add</button>
          <button type="button" class="button cancel-button" @click="cancelForm">Cancel</button>
        </div>
      </form>
      <div v-if="message" :class="['message', messageType]">{{ message }}</div>
    </div>
  `,
  data() {
    return {
      prime_location_name: '',
      address: '',
      pincode: '',
      price: '',
      number_of_spots: '',
      message: '',
      messageType: '' // success | error | warning
    };
  },
  methods: {
    async submitForm() {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.$store.state.auth_token
        };
        console.log("Header sent:", headers);

        const res = await fetch(location.origin + '/api/parkinglots', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            prime_location_name: this.prime_location_name,
            address: this.address,
            pincode: this.pincode,
            price: this.price,
            number_of_spots: this.number_of_spots
          })
        });

        const result = await res.json();

        if (res.ok) {
          this.message = "Parking Lot Added Successfully!";
          this.messageType = "success";
          setTimeout(() => {
            this.$router.push('/admin');
          }, 1000);
        } else {
          if (res.status === 409 || result.message?.includes("already exists")) {
            this.message = "Parking Lot already exists. Update Instead";
            this.messageType = "warning";
          } else {
            this.message = result.message || "Failed to add parking lot.";
            this.messageType = "error";
          }
        }
      } catch (err) {
        this.message = "Error connecting to server.";
        this.messageType = "error";
        console.error(err);
      }
    },
    cancelForm() {
      this.$router.push('/admin');
    }
  }
};
