const Home = {
    template : `<h1> Home </h1>`
}
import LoginPage from "../pages/LoginPage.js"
import RegisterPage from "../pages/RegisterPage.js"
import CustomerHome from "../pages/CustomerHome.js"
import AdminHome from "../pages/AdminHome.js"
import CustomerProfile from "../pages/CustomerProfile.js"
import AddParkingLot from "../components/AddParkingLot.js"
import EditParkingLot from "../components/EditParkingLot.js"

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
        path : '/customer-profile',
        component : CustomerProfile
    }
]
const router = new VueRouter({
    mode: 'hash',
    routes
})
export default router