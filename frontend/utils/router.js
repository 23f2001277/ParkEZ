import Home from "../pages/Home.js"
import LoginPage from "../pages/LoginPage.js"
import RegisterPage from "../pages/RegisterPage.js"
import AdminHome from "../pages/AdminHome.js"
import AddParkingLot from "../components/AddParkingLot.js"
import EditParkingLot from "../components/EditParkingLot.js"
import CustomerHome from "../pages/CustomerHome.js"
import Profile from "../pages/Profile.js"
import BookSpot from "../components/BookSpot.js"
import ReleaseSpot from "../components/ReleaseSpot.js"
import ViewSpot from "../components/ViewSpot.js"
import OccupiedSpotDetails from "../components/OccupiedSpotDetails.js"
import UserSummary from "../pages/UserSummary.js"
import RegisteredUsers from "../components/RegisteredUsers.js"
import AdminSummary from "../pages/AdminSummary.js"
import AdminSearch from "../pages/AdminSearch.js"

import store from "./store.js"

const routes = [
    {
        path : '/',
        component : Home
    },
    {
        path : '/login',
        component : LoginPage
    },
    {
        path : '/register',
        component : RegisterPage
    },
    {
        path : '/customer',
        component : CustomerHome
    },
    {
        path : '/admin',
        component : AdminHome
    },
    {
        path : '/add-lot',
        component : AddParkingLot
    },
    {
        path : '/edit-lot/:id',
        component : EditParkingLot
    },
    {
        path : '/view-spot/:id',
        component : ViewSpot,
        props: true
    },
    {
        path : '/occupied-spot/:id',
        component : OccupiedSpotDetails,
        props: true
    },
    {
        path : '/profile',
        component : Profile
    },
    {
        path : '/registered-users',
        component : RegisteredUsers
    },
    {
        path: '/book/:lotId',
        name: 'BookSpot',
        component: BookSpot,
        props: true
    },
    {
        path: '/release/:id',
        name: 'ReleaseSpot',
        component: ReleaseSpot,
        props: true
    },
    {
        path: '/admin-search',
        name: 'AdminSearch',
        component: AdminSearch
    },
    {
        path: '/user-summary',
        name: 'UserSummary',
        component: UserSummary
    },
    {
        path: '/admin-summary',
        name: 'AdminSummary',
        component: AdminSummary
    },
    {
        path : '/logout',
        beforeEnter(to, from, next) {
            store.dispatch('logout')
            next('/login')
        }
    }
]
const router = new VueRouter({
    mode: 'hash',
    routes
})
export default router