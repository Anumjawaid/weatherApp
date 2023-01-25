module.exports = (mongoose) => {
    const User = new mongoose.Schema({
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        cityList:{
            type: Array,
            required: true
        },
        cities: {
            type: Array,
            required: true
        }
    });

    return User;
}