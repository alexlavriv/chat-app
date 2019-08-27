const socket = io()
// Elements
const $messageForm = document.querySelector("#submitForm")
const $messageFormInput = $messageForm.querySelector('input')
const $sendLocationBtn = document.querySelector("#sendLocation")
const $messages = document.querySelector("#messages")
const $messageTemplate = document.querySelector("#message-template").innerHTML
const $geoLinkTemplate = document.querySelector("#geoLink-template").innerHTML
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML


const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll = () =>{
    //get new message element
    const $newMessage = $messages.lastElementChild

    //Height of the last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    // Height of the message container
    const containerHeight = $messages.scrollHeight

    //How far have I scroled
    const scrollOffset = $messages.scrollTop + visibleHeight

    // Are we at the bottom before the last message was added
    if(containerHeight - newMessageHeight<= scrollOffset){
       
        $messages.scrollTo = $messages.scrollHeight
    }
}

socket.on('message', ({user='Admin',text,createdAt})=>{
    console.log( text)
    const html = Mustache.render($messageTemplate, {
        user,
        message:text,
        createdAt:moment(createdAt).format("hh:mm DD.MM.YYYY")
    })
    
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


socket.on('locationMessage', ({user,url,createdAt})=>{
    console.log( url)

    const html = Mustache.render($geoLinkTemplate, {
        user,
        url,
        createdAt:moment(createdAt).format("hh:mm DD.MM.YYYY")

    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
   })


$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

   
    const value = e.target.elements.message.value
    socket.emit('sendText', value,(error)=>{
        if (error){
           return console.log(error)
        }
        $messageFormInput.value=''
        $messageFormInput.focus()
        console.log ('Message delivered')
    })
})

$sendLocationBtn.addEventListener('click',()=>{
    $sendLocationBtn.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation){
        return alert('Geolocation is not supported')
    }
    navigator.geolocation.getCurrentPosition(({coords})=>{
        const {longitude, latitude} = coords;

        socket.emit('locationMessage',{longitude,latitude},()=>{
            $sendLocationBtn.removeAttribute('disabled')
            console.log("Located shared!")
        })
    })
})
socket.on('roomData',({room,users})=>
{
   const html = Mustache.render($sidebarTemplate,{room, users})
  document.querySelector('#sidebar').innerHTML = html
})
socket.emit('join',{username, room},(error)=>{
    if(error)
    {
        console.log(error)
        location.href = '/'
    }
})