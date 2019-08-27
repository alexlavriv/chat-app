const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const pub_dir = path.join(__dirname,'../public');
const Filter = require('bad-words')
const port = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const {generateMessage, generateLocationUrl}= require('./utils/messages')
const {addUser, getUser, getUsersInRoom, removeUser} = require('./utils/users')
app.use(express.static(pub_dir))

// will run on every client
let welcomeMsg ='Welcome motherfucker!';
io.on('connection',(socket)=>{
   // console.log('New web socket connection')
    // send to the user
    socket.on('join', ({username,room},callback)=>{
        const {error, user}= addUser({id:socket.id, username, room})


        if(error){
            return callback(error)
        }


        socket.join(user.room)
       
        socket.emit('message', generateMessage('Admin', welcomeMsg) )
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined`))
        io.to(room).emit('roomData',{
            room,
            users: getUsersInRoom(room)
        })
        callback()
        //socket.emit - sends to the client.
        //io.emit - send to every client.
        //socket.broadcast.emit - send to every body except the client
        //io.to.emit - every body in the room
        //socket.broadcast.to(room).emit - every body except the client in the room
    })
      socket.on('sendText', (text, ackClient)=>{
       
        const filter =new Filter();
        if (filter.isProfane(text)){
            return ackClient('profanity is not allowed')
        }
        const {room, username} = getUser(socket.id)
       io.to(room).emit("message",generateMessage(username,text))
       ackClient()
    })
    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if (user)
            {socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))


            io.to(user.room).emit('roomData',{
                "room":user.room,
                users: getUsersInRoom(user.room)})
            }
    })
    socket.on('locationMessage', ({longitude, latitude}, cb)=>{
        const {room, username} = getUser(socket.id)
        io.to(room).emit('locationMessage', generateLocationUrl(username,`https://google.com/maps?q=${latitude},${longitude}`))
    cb();
    })
})
server.listen(port,()=>
{
    console.log('Server is up')
})



// app.get('/',(req,res)=>{
//     res.render('index.html')
// }
// )
