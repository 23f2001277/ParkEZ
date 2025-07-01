import Navbar from "./components/Navbar.js"
import router from "./utils/router.js"
import store from "./utils/store.js"

const app = new Vue({
    el: '#app',
    template: `
        <div> 
            <Navbar v-if="shouldShowNavbar" />
            <router-view></router-view>
        </div>
    `,
    components: {
        Navbar,
    },
    router,
    store,
    
    computed: {
        shouldShowNavbar() {
            // Hide navbar when user is logged in
            return this.$route.path === '/';
        }
    },
    
    // Initialize store with user data from localStorage on app load
    created() {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                this.$store.commit('setUser', JSON.parse(userData));
            } catch (error) {
                // Handle invalid JSON in localStorage
                localStorage.removeItem('user');
            }
        }
    }
})