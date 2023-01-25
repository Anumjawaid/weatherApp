module.exports = (mongoose) => {
  
    let cityData = new mongoose.Schema({
        Name: {
            type: String,
            required: true
        },
        detail: {
            type: mongoose.SchemaTypes.Mixed,
            required: true
        }
      })
      
     

    return cityData;
}