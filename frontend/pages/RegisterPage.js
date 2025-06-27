export default {
	template: `
	<div class="register-container">
		<div class="register-card">    
			<div class="card-header">
				<h2 class="card-title">Create Your Account</h2>
				<p class="card-subtitle">Join ParkEZ and never worry about parking again</p>
			</div>
			
			<div v-if="error" class="alert alert-error">
				<span class="alert-icon">⚠️</span>
				{{ error }}
			</div>
			<div v-if="success" class="alert alert-success">
				<span class="alert-icon">✅</span>
				{{ success }}
			</div>

			<form @submit.prevent="register" class="register-form">
				<div class="form-row">
					<div class="form-group">
						<label for="user-fullname" class="form-label">Full Name</label>
						<input 
							type="text" 
							class="form-input" 
							id="user-fullname" 
							v-model="cred.full_name" 
							placeholder="Enter your full name"
							required
						>
					</div>
					<div class="form-group">
						<label for="user-age" class="form-label">Age</label>
						<input 
							type="number" 
							class="form-input" 
							id="user-age" 
							v-model="cred.age" 
							placeholder="18+"
							min="18"
							required
						>
					</div>
				</div>

				<div class="form-group">
					<label for="user-email" class="form-label">Email Address</label>
					<input 
						type="email" 
						class="form-input" 
						id="user-email" 
						v-model="cred.email" 
						placeholder="Enter your email"
						required
					>
				</div>

				<div class="form-group">
					<label for="user-phone_number" class="form-label">Phone Number</label>
					<input 
						type="tel" 
						class="form-input" 
						id="user-phone_number" 
						v-model="cred.phone_number" 
						placeholder="Enter your phone number"
						pattern="[0-9]{10}"
						required
					>
				</div>

				<div class="form-group">
					<label for="user-address" class="form-label">Address</label>
					<textarea 
						class="form-input form-textarea" 
						id="user-address" 
						v-model="cred.address" 
						placeholder="Enter your address"
						rows="3"
						required
					></textarea>
				</div>

				<div class="form-group">
					<label for="user-vehicle_number" class="form-label">Vehicle Number</label>
					<input 
						type="text" 
						class="form-input" 
						id="user-vehicle_number" 
						v-model="cred.vehicle_number" 
						placeholder="e.g., WB 01 AB 1234"
						style="text-transform: uppercase;"
						required
					>
				</div>

				<div class="form-group">
					<label for="user-password" class="form-label">
						Password
						<span class="password-toggle" @click="togglePasswordVisibility('password')">
							{{ showPassword ? '👁️' : '🙈' }}
						</span>
					</label>
					<input 
						:type="showPassword ? 'text' : 'password'" 
						class="form-input" 
						:class="{ 'input-error': passwordError, 'input-success': isPasswordStrong }"
						id="user-password" 
						v-model="cred.password" 
						placeholder="Create a strong password"
						@input="validatePassword"
						required
					>
					<div class="password-strength">
						<div class="strength-meter">
							<div class="strength-bar" :class="passwordStrengthClass" :style="{ width: passwordStrength + '%' }"></div>
						</div>
						<span class="strength-text" :class="passwordStrengthClass">{{ passwordStrengthText }}</span>
					</div>
					<div v-if="passwordError" class="form-error">{{ passwordError }}</div>
					<div class="password-requirements">
						<h4>Password Requirements:</h4>
						<ul class="requirements-list">
							<li :class="{ 'valid': requirements.length }">
								<span class="req-icon">{{ requirements.length ? '✅' : '❌' }}</span>
								At least 8 characters
							</li>
							<li :class="{ 'valid': requirements.uppercase }">
								<span class="req-icon">{{ requirements.uppercase ? '✅' : '❌' }}</span>
								One uppercase letter
							</li>
							<li :class="{ 'valid': requirements.lowercase }">
								<span class="req-icon">{{ requirements.lowercase ? '✅' : '❌' }}</span>
								One lowercase letter
							</li>
							<li :class="{ 'valid': requirements.number }">
								<span class="req-icon">{{ requirements.number ? '✅' : '❌' }}</span>
								One number
							</li>
							<li :class="{ 'valid': requirements.special }">
								<span class="req-icon">{{ requirements.special ? '✅' : '❌' }}</span>
								One special character (!@#$%^&*)
							</li>
						</ul>
					</div>
				</div>

				<div class="form-group">
					<label for="user-confirm-password" class="form-label">
						Confirm Password
						<span class="password-toggle" @click="togglePasswordVisibility('confirm')">
							{{ showConfirmPassword ? '👁️' : '🙈' }}
						</span>
					</label>
					<input 
						:type="showConfirmPassword ? 'text' : 'password'" 
						class="form-input" 
						:class="{ 'input-error': confirmPasswordError, 'input-success': cred.confirm_password && !confirmPasswordError }"
						id="user-confirm-password" 
						v-model="cred.confirm_password" 
						placeholder="Confirm your password"
						@input="validateConfirmPassword"
						required
					>
					<div v-if="confirmPasswordError" class="form-error">{{ confirmPasswordError }}</div>
				</div>

				<button 
					type="submit" 
					class="btn-submit" 
					:disabled="!isFormValid || isSubmitting"
					:class="{ 'loading': isSubmitting }"
				>
					<span v-if="isSubmitting" class="spinner"></span>
					{{ isSubmitting ? 'Creating Account...' : 'Create Account' }}
				</button>
			</form>

			<div class="login-link">
				<span>Already have an account? </span>
				<router-link to="/login" class="link">Sign In</router-link>
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
				vehicle_number: '',
				age: '',
			},
			error: null,
			success: null,
			passwordError: null,
			confirmPasswordError: null,
			showPassword: false,
			showConfirmPassword: false,
			isSubmitting: false,
			requirements: {
				length: false,
				uppercase: false,
				lowercase: false,
				number: false,
				special: false
			}
		};
	},
	computed: {
		passwordStrength() {
			const password = this.cred.password;
			if (!password) return 0;
			
			let score = 0;
			if (password.length >= 8) score += 20;
			if (password.length >= 12) score += 10;
			if (/[a-z]/.test(password)) score += 20;
			if (/[A-Z]/.test(password)) score += 20;
			if (/[0-9]/.test(password)) score += 20;
			if (/[^A-Za-z0-9]/.test(password)) score += 20;
			
			return Math.min(score, 100);
		},
		passwordStrengthText() {
			const strength = this.passwordStrength;
			if (strength === 0) return '';
			if (strength < 40) return 'Weak';
			if (strength < 70) return 'Medium';
			if (strength < 90) return 'Strong';
			return 'Very Strong';
		},
		passwordStrengthClass() {
			const strength = this.passwordStrength;
			if (strength < 40) return 'weak';
			if (strength < 70) return 'medium';
			if (strength < 90) return 'strong';
			return 'very-strong';
		},
		isPasswordStrong() {
			return this.passwordStrength >= 70 && Object.values(this.requirements).every(req => req);
		},
		isFormValid() {
			return this.cred.full_name && 
				   this.cred.email && 
				   this.cred.address && 
				   this.cred.phone_number && 
				   this.cred.vehicle_number && 
				   this.cred.age >= 18 && 
				   this.isPasswordStrong && 
				   !this.confirmPasswordError;
		}
	},
	methods: {
		validatePassword() {
			const password = this.cred.password;
			this.passwordError = null;
			
			// Update requirements
			this.requirements.length = password.length >= 8;
			this.requirements.uppercase = /[A-Z]/.test(password);
			this.requirements.lowercase = /[a-z]/.test(password);
			this.requirements.number = /[0-9]/.test(password);
			this.requirements.special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
			
			// Validate confirm password when password changes
			if (this.cred.confirm_password) {
				this.validateConfirmPassword();
			}
		},
		validateConfirmPassword() {
			if (this.cred.password !== this.cred.confirm_password) {
				this.confirmPasswordError = "Passwords do not match";
			} else {
				this.confirmPasswordError = null;
			}
		},
		togglePasswordVisibility(field) {
			if (field === 'password') {
				this.showPassword = !this.showPassword;
			} else {
				this.showConfirmPassword = !this.showConfirmPassword;
			}
		},
		async register() {
			this.error = null;
			this.success = null;
			this.isSubmitting = true;

			// Final validation
			if (!this.isPasswordStrong) {
				this.error = "Please create a stronger password that meets all requirements";
				this.isSubmitting = false;
				return;
			}

			if (this.cred.password !== this.cred.confirm_password) {
				this.error = "Passwords do not match";
				this.isSubmitting = false;
				return;
			}

			if (parseInt(this.cred.age) < 18) {
				this.error = "You must be at least 18 years old to register";
				this.isSubmitting = false;
				return;
			}

			// Phone number validation
			if (!/^[0-9]{10}$/.test(this.cred.phone_number)) {
				this.error = "Please enter a valid 10-digit phone number";
				this.isSubmitting = false;
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
					this.success = "Account created successfully! Redirecting to login...";
					setTimeout(() => {
						this.$router.push("/login");
					}, 2000);
				} else {
					this.error = data.message || "Registration failed. Please try again.";
				}
			} catch (e) {
				this.error = "Network error. Please check your connection and try again.";
			} finally {
				this.isSubmitting = false;
			}
		},
	},
	mounted() {
		const style = document.createElement('style');
		style.textContent = `
			.register-container {
				min-height: 100vh;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 2rem 1rem;
			}

			.register-card {
				background: white;
				border-radius: 20px;
				box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
				padding: 2.5rem;
				width: 100%;
				max-width: 600px;
				animation: slideUp 0.5s ease;
			}

			@keyframes slideUp {
				from {
					opacity: 0;
					transform: translateY(30px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			.card-header {
				text-align: center;
				margin-bottom: 2rem;
			}

			.card-title {
				font-size: 2rem;
				font-weight: 700;
				color: #333;
				margin-bottom: 0.5rem;
			}

			.card-subtitle {
				color: #666;
				font-size: 1rem;
				margin: 0;
			}

			.register-form {
				display: flex;
				flex-direction: column;
				gap: 1.5rem;
			}

			.form-row {
				display: grid;
				grid-template-columns: 2fr 1fr;
				gap: 1rem;
			}

			.form-group {
				display: flex;
				flex-direction: column;
			}

			.form-label {
				font-weight: 600;
				color: #333;
				margin-bottom: 0.5rem;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			.password-toggle {
				cursor: pointer;
				font-size: 1.2rem;
				user-select: none;
			}

			.form-input {
				padding: 0.875rem 1rem;
				border: 2px solid #e1e5e9;
				border-radius: 10px;
				font-size: 1rem;
				transition: all 0.3s ease;
				background: #f8f9fa;
			}

			.form-input:focus {
				outline: none;
				border-color: #667eea;
				background: white;
				box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
			}

			.form-input.input-error {
				border-color: #dc3545;
				background: #fff5f5;
			}

			.form-input.input-success {
				border-color: #28a745;
				background: #f0fff4;
			}

			.form-textarea {
				resize: vertical;
				min-height: 80px;
			}

			.password-strength {
				margin-top: 0.5rem;
			}

			.strength-meter {
				height: 4px;
				background: #e1e5e9;
				border-radius: 2px;
				overflow: hidden;
				margin-bottom: 0.25rem;
			}

			.strength-bar {
				height: 100%;
				transition: all 0.3s ease;
				border-radius: 2px;
			}

			.strength-bar.weak {
				background: #dc3545;
			}

			.strength-bar.medium {
				background: #ffc107;
			}

			.strength-bar.strong {
				background: #28a745;
			}

			.strength-bar.very-strong {
				background: #007bff;
			}

			.strength-text {
				font-size: 0.875rem;
				font-weight: 600;
			}

			.strength-text.weak {
				color: #dc3545;
			}

			.strength-text.medium {
				color: #ffc107;
			}

			.strength-text.strong {
				color: #28a745;
			}

			.strength-text.very-strong {
				color: #007bff;
			}

			.password-requirements {
				margin-top: 0.75rem;
				padding: 1rem;
				background: #f8f9fa;
				border-radius: 8px;
				border: 1px solid #e1e5e9;
			}

			.password-requirements h4 {
				font-size: 0.875rem;
				margin: 0 0 0.5rem 0;
				color: #333;
			}

			.requirements-list {
				list-style: none;
				padding: 0;
				margin: 0;
			}

			.requirements-list li {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				font-size: 0.875rem;
				color: #666;
				margin-bottom: 0.25rem;
			}

			.requirements-list li.valid {
				color: #28a745;
			}

			.req-icon {
				font-size: 0.75rem;
			}

			.form-error {
				color: #dc3545;
				font-size: 0.875rem;
				margin-top: 0.25rem;
			}

			.alert {
				padding: 1rem;
				border-radius: 10px;
				margin-bottom: 1.5rem;
				display: flex;
				align-items: center;
				gap: 0.5rem;
			}

			.alert-error {
				background: #f8d7da;
				color: #721c24;
				border: 1px solid #f5c6cb;
			}

			.alert-success {
				background: #d4edda;
				color: #155724;
				border: 1px solid #c3e6cb;
			}

			.alert-icon {
				font-size: 1.2rem;
			}

			.btn-submit {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: white;
				border: none;
				padding: 1rem 2rem;
				border-radius: 10px;
				font-size: 1.1rem;
				font-weight: 600;
				cursor: pointer;
				transition: all 0.3s ease;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 0.5rem;
				margin-top: 1rem;
			}

			.btn-submit:hover:not(:disabled) {
				transform: translateY(-2px);
				box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
			}

			.btn-submit:disabled {
				opacity: 0.6;
				cursor: not-allowed;
				transform: none;
			}

			.spinner {
				width: 20px;
				height: 20px;
				border: 2px solid transparent;
				border-top: 2px solid currentColor;
				border-radius: 50%;
				animation: spin 1s linear infinite;
			}

			@keyframes spin {
				to {
					transform: rotate(360deg);
				}
			}

			.login-link {
				text-align: center;
				margin-top: 1.5rem;
				color: #666;
			}

			.link {
				color: #667eea;
				text-decoration: none;
				font-weight: 600;
			}

			.link:hover {
				text-decoration: underline;
			}

			@media (max-width: 768px) {
				.register-container {
					padding: 1rem;
				}

				.register-card {
					padding: 1.5rem;
				}

				.form-row {
					grid-template-columns: 1fr;
				}

				.card-title {
					font-size: 1.75rem;
				}
			}
		`;
		document.head.appendChild(style);
	}
};