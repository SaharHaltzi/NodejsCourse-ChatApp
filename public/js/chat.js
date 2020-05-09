const socket = io();
const messageForm = document.querySelector('#message-form');
const messageFormButton =  messageForm.querySelector('button');
const messageFormInput = messageForm.querySelector('input');
const locationButton = document.querySelector('#send-location');
const messages = document.querySelector('#messages');


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    messageFormButton.setAttribute('disabled', 'disabled');

    const message = event.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        messageFormButton.removeAttribute('disabled');
        messageFormInput.value = '';
        messageFormInput.focus();

        if(error) {
            console.log(error);
        }
        else {
            console.log('message delivered');
        }
    });
})

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});
socket.emit('join', { username,room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/';
    }
});

const autoScroll = () => {
    //New message element
    const $newMessage = messages.lastElementChild;
    //Height new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight  + newMessageMargin;
    
    //visible height 
    const visibleHeight = messages.offsetHeight;
    //Height of messges container 
    const containerHeight = messages.scrollHeight;
    //How far have i scrolled
    const scrollOffset = messages.scrollTop + visibleHeight;

    //Check if we are in the bottom before the new message was added
    if(containerHeight-newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    console.log('Message received from server:', message);
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a')
    });

    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
})

socket.on('locationMessage', (locationData) => {
    const html = Mustache.render(locationTemplate, {
        username: locationData.username,
        url: locationData.url,
        createdAt: moment(locationData.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
})
document.querySelector('#send-location').addEventListener('click', () => {
    
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser...');
    }

    locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
             latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            locationButton.removeAttribute('disabled');
            if(error) {
                return console.log(error)
            }
            console.log('Location Shared!');
        })
    });

})