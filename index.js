let express=require('express')
let app=express()
const http=require('http')
const server=http.createServer(app)
const {Server} =require('socket.io')
const cors = require('cors');
const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });
app.use(cors());
app.use(express.urlencoded({ extended: false }))
app.use(express.json());

const routes = require('./controller/routesController');
const mongoose = require('mongoose');
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb+srv://Anum:anum@cluster0.x9rxwjh.mongodb.net/wheather`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('connection successful..');
}).catch((err) => console.log(err));

io.on('connection', (socket) => {
    console.log('a user connected');

    app.use('/', routes.routes(socket));

});


server.listen(3001,()=>{
   console.log("Server listening in port 3001")
})