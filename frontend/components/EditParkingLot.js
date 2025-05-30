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

  .message {
    margin-bottom: 15px; padding: 10px;
    border-radius: 5px; font-weight: bold;
  }
  .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
  .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
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
      originalData: {},
      message: '',
      messageType: '', // 'success' or 'error'
    };
  },
  async mounted() {
  this.lotId = this.$route.params.id;
  let token = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      token = user.token;
    }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
  }

  if (!token) {
    this.message = "Authentication required. Please log in.";
    this.messageType = "error";
    this.$router.push("/login");
    return;
  }

  try {
    const res = await fetch(`/api/parkinglots/${this.lotId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await res.json();

    if (!data || !data.id) {
      this.message = "Parking lot not found.";
      this.messageType = "error";
      return;
    }

    // Fill and store original data
    this.prime_location_name = data.prime_location_name;
    this.address = data.address;
    this.pincode = data.pincode;
    this.price = data.price;
    this.number_of_spots = data.number_of_spots;
    this.originalData = { ...data };

  } catch (err) {
    console.error(err);
    this.message = "Failed to load parking lot.";
    this.messageType = "error";
  }
},
  methods: {
    async submitUpdate() {
      let token = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          token = user.token;
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }

      if (!token) {
        this.message = "Authentication required. Please log in.";
        this.messageType = "error";
        this.$router.push("/login");
        return;
      }

      const updatedData = {
        prime_location_name: this.prime_location_name,
        address: this.address,
        pincode: this.pincode,
        price: parseInt(this.price),
        number_of_spots: parseInt(this.number_of_spots),
      };

      // Check for changes
      const isChanged = Object.entries(updatedData).some(
        ([key, value]) => value !== this.originalData[key]
      );

      if (!isChanged) {
        this.message = "No changes made.";
        this.messageType = "error";
        return;
      }

      try {
        const res = await fetch(`/api/parkinglots/${this.lotId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedData)
        });

        if (res.ok) {
          this.message = "Parking lot updated successfully!";
          this.messageType = "success";
          setTimeout(() => {
            this.$router.push('/admin');
          }, 1000)
        } else {
          const errorData = await res.json();
          this.message = errorData.message || errorData.error || "Update failed.";
          this.messageType = "error";
        }
      } catch (error) {
        console.error('Network error:', error);
        this.message = "Network error. Please try again.";
        this.messageType = "error";
      }
    },
    cancelEdit() {
      this.$router.push("/admin");
    }
  },
  template: `
    <div class="form-container">
      <h2>Edit Parking Lot</h2>
      <div v-if="message" :class="'message ' + messageType">{{ message }}</div>
      <form @submit.prevent="submitUpdate">
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
          <input type="number" id="price" v-model.number="price" required>
        </div>
        <div class="form-group">
          <label for="number_of_spots">Max Spots Available:</label>
          <input type="number" id="number_of_spots" v-model.number="number_of_spots" required>
        </div>
        <div class="button-group">
          <button type="submit" class="button update-button">Update</button>
          <button type="button" class="button cancel-button" @click="cancelEdit">Cancel</button>
        </div>
      </form>
    </div>
  `
};