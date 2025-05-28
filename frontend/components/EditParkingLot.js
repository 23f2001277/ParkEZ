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
  .update-button { background-color: #27ae60; }
  .cancel-button { background-color: #bdc3c7; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default {
  data() {
    return {
      lotId: null,
      prime_location_name: '',
      address: '',
      pincode: '',
      price: '',
      number_of_spots: '',
      error: ''
    };
  },
  async mounted() {
    this.lotId = this.$route.params.id;
    try {
      const res = await fetch(`/api/parkinglots/${this.lotId}`);
      const data = await res.json();

      if (!data || !data.id) {
        this.error = "Parking lot not found.";
        return;
      }

      // Fill form values
      this.prime_location_name = data.prime_location_name;
      this.address = data.address;
      this.pincode = data.pincode;
      this.price = data.price;
      this.number_of_spots = data.number_of_spots;

    } catch (err) {
      console.error(err);
      this.error = "Failed to load parking lot.";
    }
  },
  methods: {
    async submitUpdate() {
      const res = await fetch(`/api/parkinglots/${this.lotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prime_location_name: this.prime_location_name,
          address: this.address,
          pincode: this.pincode,
          price: this.price,
          number_of_spots: this.number_of_spots
        })
      });

      if (res.ok) {
        alert("Parking Lot Updated Successfully");
        this.$router.push("/adminhome");
      } else {
        alert("Failed to update parking lot.");
      }
    },
    cancelEdit() {
      this.$router.push("/adminhome");
    }
  },
  template: `
    <div class="form-container">
      <h2>Edit Parking Lot</h2>
      <div v-if="error" style="color: red; margin-bottom: 10px;">{{ error }}</div>
      <form v-if="!error" @submit.prevent="submitUpdate">
        <div class="form-group">
          <label for="prime_location_name">Prime Location Name:</label>
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
          <label for="price">Price Per Hour:</label>
          <input type="number" id="price" v-model="price" required>
        </div>
        <div class="form-group">
          <label for="number_of_spots">Max Spots Available:</label>
          <input type="number" id="number_of_spots" v-model="number_of_spots" required>
        </div>
        <div class="button-group">
          <button type="submit" class="button update-button">Update</button>
          <button type="button" class="button cancel-button" @click="cancelEdit">Cancel</button>
        </div>
      </form>
    </div>
  `
};
