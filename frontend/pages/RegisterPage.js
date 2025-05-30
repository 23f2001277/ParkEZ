export default {
	template: `
	<div class="d-flex justify-content-center align-items-center vh-100" style="margin-top: 5vh">
		<div class="card shadow-lg p-3 mb-5 bg-white rounded" style="width: 40rem;">    
			<h2 class="card-title text-center p-1">Customer Signup</h2>
			
			<div v-if="error" class="text-danger text-center">{{ error }}</div>
			<div v-if="success" class="text-success text-center">{{ success }}</div>

			<form @submit.prevent="register">
				<div class="form-group row mb-3">
					<label for="user-fullname" class="col-sm-2 col-form-label">Name:</label>
					<div class="col-sm-10">
						<input type="text" class="form-control" id="user-fullname" v-model="cred.full_name" required>
					</div>
				</div>
				<div class="form-group row mb-3">
					<label for="user-email" class="col-sm-2 col-form-label">Email:</label>
					<div class="col-sm-10">
						<input type="email" class="form-control" id="user-email" v-model="cred.email" required>
					</div>
				</div>
				<div class="form-group row mb-3">
					<label for="user-address" class="col-sm-2 col-form-label">Address:</label>
					<div class="col-sm-10">
						<input type="text" class="form-control" id="user-address" v-model="cred.address" required>
					</div>
				</div>
				<div class="form-group row mb-3">
					<label for="user-phone_number" class="col-sm-2 col-form-label">Phone Number:</label>
					<div class="col-sm-10">
						<input type="text" class="form-control" id="user-phone_number" v-model="cred.phone_number" required>
					</div>
				</div>
				<div class="form-group row mb-3">
					<label for="user-vehicle_number" class="col-sm-2 col-form-label">Vehicle Number:</label>
					<div class="col-sm-10">
						<input type="text" class="form-control" id="user-vehicle_number" v-model="cred.vehicle_number" required>
					</div>
				</div>
				<div class="form-group row mb-3">
					<label for="user-age" class="col-sm-2 col-form-label">Age:</label>
					<div class="col-sm-10">
						<input type="number" class="form-control" id="user-age" v-model="cred.age" required>
					</div>
				</div>
				<div class="form-group row mb-3">
					<label for="user-password" class="col-sm-2 col-form-label">Password:</label>
					<div class="col-sm-10">
						<input type="password" class="form-control" id="user-password" v-model="cred.password" required>
					</div>
				</div>
				<div class="form-group row mb-3">
					<label for="user-confirm-password" class="col-sm-2 col-form-label">Confirm Password:</label>
					<div class="col-sm-10">
						<input type="password" class="form-control" id="user-confirm-password" v-model="cred.confirm_password" required>
					</div>
				</div>
				<div class="text-center">
					<button type="submit" class="btn btn-outline-primary mt-2">Register</button>
				</div>
			</form>

			<div class="mt-3 text-center">
				<span>Already have an account? </span>
				<router-link to="/login" class="text-primary text-decoration-none">Login</router-link>
			</div>
		</div>
	</div>
	`,
	data() {
		return {
			cred: {
				email: '',
				password: '',
				confirm_password: '',
				full_name: '',
				address: '',
				phone_number: '',
				age: '',
			},
			error: null,
			success: null,
		};
	},
	methods: {
		async register() {
			this.error = null;
			this.success = null;

			if (this.cred.password !== this.cred.confirm_password) {
				this.error = "Passwords do not match";
				return;
			}

			if (parseInt(this.cred.age) < 18) {
				this.error = "You must be at least 18 years old to register";
				return;
			}

			try {
				const res = await fetch("/register", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(this.cred),
				});

				const data = await res.json();

				if (res.ok) {
					this.success = "Registration successful! Redirecting to login...";
					setTimeout(() => {
						this.$router.push("/login");
					}, 1500);
				} else {
					this.error = data.message || "Registration failed";
				}
			} catch (e) {
				this.error = "An unexpected error occurred.";
			}
		},
	},
};