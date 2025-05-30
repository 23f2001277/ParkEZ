export default {
  name: 'RegisteredUser',
  data() {
    return {
      users: [],
      loading: true,
      error: null
    };
  },
  async mounted() {
    try {
      const userStr = localStorage.getItem('user');
      let token = '';
      if (userStr) token = JSON.parse(userStr).token;
      const res = await fetch('/api/registered-users', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        this.users = data.users || [];
      } else {
        this.error = data.error || 'Failed to load users';
      }
    } catch (e) {
      this.error = 'Failed to load users';
    } finally {
      this.loading = false;
    }
  },
  template: `
    <div class="container mt-4">
      <h2 class="mb-4 text-center">Registered Users</h2>
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border" role="status"></div>
        <p class="mt-2">Loading users...</p>
      </div>
      <div v-else-if="error" class="alert alert-danger text-center">{{ error }}</div>
      <div v-else>
        <div v-if="users.length === 0" class="alert alert-info text-center">No users found.</div>
        <div v-else class="table-responsive">
          <table class="table table-bordered table-hover">
            <thead class="thead-light">
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Vehicle No.</th>
                <th>Address</th>
                <th>Age</th>
                <th>Active</th>
                <th>Roles</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.full_name }}</td>
                <td>{{ user.phone_number }}</td>
                <td>{{ user.vehicle_number }}</td>
                <td>{{ user.address }}</td>
                <td>{{ user.age }}</td>
                <td>
                  <span :class="user.active ? 'badge bg-success' : 'badge bg-danger'">
                    {{ user.active ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td>
                  <span v-for="role in user.roles" :key="role.id" class="badge bg-primary me-1">
                    {{ role.name }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
};