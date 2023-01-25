const routes = require('express').Router()
const mongoose = require('mongoose');
const userSchema = require('../Models/userModel.js')(mongoose);
const userModule = new mongoose.model('userLogin', userSchema);
const citySchema = require('../Models/dataModel')(mongoose)
const masterModule = new mongoose.model('MasterCities', citySchema)
const dotenv = require('dotenv');
const bcrypt = require("bcrypt")
const saltRounds = 10
const { default: axios } = require('axios');
let defaultCities = ["Karachi", "Lahore", "Islamabad", "Quetta", "Peshawar"]
dotenv.config();
let API = process.env.appID || "a355251073b74f4899d63723232001"


const ReturnRouter = function (socket) {

    routes.get('/', (req, res) => {
        console.log(API, "ID")
        res.send({ 'message': "Hi I am Running" })
    })

    socket.on('click', (msg) => {
        console.log("socket", socket.id)
        socket.emit('getSocketId', socket.id);
    });

    socket.on('disconnect', async () => {
        console.log('user disconnected');
    });
    // Weather Default 
    async function getWeatherDefault() {

        let locationArray = ["Karachi", "Lahore", "Islamabad", "Quetta", "Peshawar", "Hyderabad", 'Ziarat', "Khuzdar", "Sialkot","Faisalabad"]
        for (let i = 0; i < locationArray.length; i++) {
            let exist = await masterModule.find({ 'Name': locationArray[i] })
            try {
                let weather = await axios.get(`http://api.weatherapi.com/v1/current.json?key=${API}&q=${locationArray[i]}&aqi=no`)
                console.log(exist, "exist")
                console.log(weather.data, "data")
                if (exist.length != 0) {
                    const _id = exist[0]._id;
                    const updateactivity = await masterModule.findByIdAndUpdate({ _id },
                        {
                            $set: {
                                Name: weather.data.location.name,
                                detail: { temp: weather.data.current.temp_c, condition: weather.data.current.condition }
                            }
                        },
                        { new: true });
                }
                else {
                    const cityData = new masterModule({
                        Name: locationArray[i],
                        detail: { temp: weather.data.current.temp_c, condition: weather.data.current.condition }
                    })
                    let citySave = cityData.save()
                    console.log(citySave, "city Data save")
                }
            }
            catch (e) {
                console.log(e, "error in axios")
            }
        }

    }

    // getWeatherDefault()
    async function test(def) {
        const records = await masterModule.find({ 'Name': { $in: def } });
        // console.log(records,"records")
        return records

    }
    let a = test()
    console.log(a, "a")
    async function validateUser(password, hash) {

        return await bcrypt
            .compare(password, hash)
            .then(res => {
                console.log(res) // return true
                return res
            })
            .catch(
                err => {
                    console.error(err.message)
                    return false
                }
            )
    }

    // for querying user

    routes.post('/queryUser', async (req, res) => {

        const result = await userModule.find({ email: req.body.data.email })
        if (result.length != 0) {
            let valid = await validateUser(req.body.data.password, result[0].password)
            valid ?
                res.send({ message: "valid ", result: result })
                :
                res.send({ message: "Invalid", result: "Password doesnot match" })
        }
        else {
            res.send({ message: "User doesnot exist" });
        }

    });

    routes.post('/addUser', async (req, res) => {


        const addActivity = new userModule({
            firstName: req.body.data.firstName,
            lastName: req.body.data.lastName,
            email: req.body.data.email,
            password: await bcrypt.hash(req.body.data.password, saltRounds),
            cityList: defaultCities,
            cities: await test(defaultCities)

        });

        const result = await addActivity.save();

        res.send({ message: "User Created", result: result });
    });
    //Specific city modal for a user
    routes.post('/getWeather', async (req, res) => {

        // Get a single city
        let city = req.body.q;
        let weather;
        // Use that city name to fetch data
        // Use the API_KEY 
        let url = `http://api.weatherapi.com/v1/current.json?key=${API}&q=${city}&aqi=no`;
        try {
            let weather = await axios.get(url)
            res.send({
                'message': "Resolved",
                result: weather.data
            })
        }
        catch (e) {
            console.log(e, "error in axios")
            res.send({
                'message': "No City Exist",
                result: null
            })
        }


    });
    // Prerequisite city name and logged in user id format req.body.data.soso
    routes.post('/addCity', async (req, res) => {
        let _id=req.body.data._id
        const result = await userModule.findById(_id)
        console.log(result, "result")
        let newCity=[...defaultCities,req.body.data.city]
        console.log(newCity,"newCity")
        let city = result.cityList.find(element => element == req.body.data.city)
        if (city != undefined) {
            res.send({ message: 'This City Has ALready Been In your List' });
        }
        else {
             let cityData=await masterModule.find({'Name':req.body.data.city})
             if(cityData.length!=0){
                // Update to Users List
                const updateactivity = await userModule.findByIdAndUpdate({ _id },
                    {
                        $set: {
                           cityList:newCity,
                           cities: await test(newCity)

                        }
                    },
                    { new: true });
                    res.send({ message: "valid", result: updateactivity })

             }
             else{
                try {
                    let weather = await axios.get(`http://api.weatherapi.com/v1/current.json?key=${API}&q=${req.body.data.city}&aqi=no`)
                    console.log(weather.data, "data")
                   
                        const cityData = new masterModule({
                            Name: req.body.data.city,
                            detail: { temp: weather.data.current.temp_c, condition: weather.data.current.condition }
                        })
                        let citySave = cityData.save()
                        console.log(citySave, "city Data save")
                        const updateactivity = await userModule.findByIdAndUpdate({ _id },
                            {
                                $set: {
                                    cityList:newCity,
                                    cities: await test(newCity)
        
                                }
                            },
                            { new: true });
                            console.log(updateactivity,"update")
                            res.send({ message: "added", result: updateactivity })
                    
                }
                catch (e) {
                    console.log(e, "error in axios")
                    res.send({ message: "No such City Exist", result: null })
                }

             }

        }

    })
   setInterval(()=>getWeatherDefault,8000)



    return routes
}

module.exports = {
    routes: ReturnRouter
}