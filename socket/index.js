let gameRooms = [
    // roomkey: {
    //     // users: [],
    //     // randomTasks: [],
    //     // scores: [],
    //     // gameScore: 0,
    //     players: {
    //     'id':{
    //         x
    //         y
    //      role:
    //         playerID:
    //         skin:{
    //         }

    //     }
    // },
    //     numPlayers: 0
    // }
]
let colorPlayer = [
    'blue',
    'red',
    'blue_dark',
    'blue_light',
    'gray_dark',
    'gray_light',
    'green_dark',
    'green_light',
    'orange',
    'purple',
    'yellow',
    'pink']
module.exports = (io) => {

    io.on('connection', (socket) => {


        console.log(socket.id + ' connected');

        socket.on('joinRoom', (roomkey) => {

            socket.join(roomkey)


            const roomInfo = gameRooms[roomkey]
            if (Object.keys(roomInfo.players)[0] !== socket.id) {
                let randColor = random_item(roomInfo.color)
                roomInfo.players[socket.id] = {
                    x: 0,
                    y: 0,
                    role: 0, //0: crew 1: imposter
                    host: false,
                    playerId: socket.id,
                    name: '',
                    color: randColor
                }
                roomInfo.color.filter(x => x !== randColor)
            }

            //who is host in room   
            if (Object.keys((roomInfo).players)[0] == socket.id) {
                Object.values((roomInfo).players)[0].host = true;
            }



            roomInfo.numPlayers = Object.keys(roomInfo.players).length;

            //  console.log(roomInfo);

            //in waitingRoom
            socket.emit('setState', roomInfo)

            // socket.emit('joined')

            //list player trong 1 room
            console.log(roomInfo);
            socket.emit('currentPlayers', {
                players: roomInfo.players,
                numPlayers: roomInfo.numPlayers,
                roomInfo: roomInfo
            })

            socket.to(roomkey).emit('newPlayer', {
                playerInfo: roomInfo.players[socket.id],
                numPlayers: roomInfo.numPlayers,
            });

        })


        // lấy những player đã ở trong game + toạ độ

        // lắng nghe tạo độ di chuyển và thông báo lại cho các broadcast theo dõi khác trong map

        socket.on('disconnect', () => {
            console.log(socket.id + ' disconnected');
            //listPlayer = listPlayer.filter(x => x !== socket.id)
        });

        //check room 
        socket.on("isKeyValid", function (input) {

            Object.keys(gameRooms).includes(input)
                ? socket.emit("keyIsValid", input)
                : socket.emit("keyNotValid");
        });
        //create new room
        socket.on("getRoomCode", async function () {
            let key = codeGenerator();
            while (Object.keys(gameRooms).includes(key)) {
                key = codeGenerator();
            }
            gameRooms[key] = {
                roomKey: key,
                players: {

                },
                numPlayers: 0,
                public: 1,
                color: [
                    'red',
                    'blue_dark',
                    'blue_light',
                    'gray_dark',
                    'gray_light',
                    'green_dark',
                    'green_light',
                    'orange',
                    'purple',
                    'yellow',
                    'pink']
            };

            socket.emit("roomCreated", key);
        });
        socket.on("getRoomCodePrivate", async function () {
            let key = codeGenerator();
            while (Object.keys(gameRooms).includes(key)) {
                key = codeGenerator();
            }
            gameRooms[key] = {
                roomKey: key,
                players: {

                },
                numPlayers: 0,
                public: 0,
                color: ['blue',
                    'red',
                    'blue_dark',
                    'blue_light',
                    'gray_dark',
                    'gray_light',
                    'green_dark',
                    'green_light',
                    'orange',
                    'purple',
                    'yellow',
                    'pink']
            };

            socket.emit("roomCreated", key);
        });

        socket.on('ok', (roomkey) => {
            console.log('when ok');
            const roomInfo = gameRooms[roomkey]
            roomInfo.players[socket.id] = {
                x: 0,
                y: 0,
                role: 0, //0: crew 1: imposter
                host: false,
                playerId: socket.id,
                name: '',
                color: 'blue'
            }

            console.log(gameRooms[roomkey]);
            socket.emit('join')

        })
        //in game
        socket.on('letgo', ({ roomId, imposter, player }) => {
            console.log(imposter);
            let numPlayers = Object(gameRooms[roomId]).numPlayers

            let idPlayers = Object.keys((gameRooms[roomId].players))
            //random role
            let i = 0;
            if (numPlayers >= 1) {
                while (i < imposter) {
                    let temp = Math.floor(Math.random() * (numPlayers - 1))
                    if (Object.values((gameRooms[roomId].players))[temp].role == 0) {
                        Object.values((gameRooms[roomId].players))[temp].role = 1;
                        i++
                    }
                }
            }
            let Info = gameRooms[roomId]
            //emit role 

            io.in(roomId).emit('gogame', ({ numPlayers, idPlayers, Info }))

        })

        socket.on('whatRole', (roomId) => {

            let isRole = (Object(gameRooms[roomId]).players)[socket.id].role

            io.to(socket.id).emit('roleIs', isRole);
        })



        socket.on('getRandomRoom', () => {
            let allRoomId = Object.keys(gameRooms);
            //lấy room public
            let publicRoom = new Array;
            allRoomId.forEach(item => {
                if (Object(gameRooms[item]).public == 1) {
                    publicRoom.push(item)
                }
            })

            let random = random_item(publicRoom) ?? '00000';
            io.to(socket.id).emit('randomRoom', (random))
        })
        socket.on('move', ({ x, y, roomId }) => {
            let colorP = (Object(gameRooms[roomId]).players[socket.id]).color
            //find in room and set position
            let id = socket.id
            Object(gameRooms[roomId]).players[id].x = x;
            Object(gameRooms[roomId]).players[id].y = y;



            socket.to(roomId).emit('move', { x, y, playerId: socket.id, color: colorP });
        });
        socket.on('moveEnd', ({ roomId }) => {
            let colorPl = (Object(gameRooms[roomId]).players[socket.id]).color
            socket.broadcast.emit('moveEnd', { playerId: socket.id, color: colorPl });
        });
        socket.on('moveW', ({ x, y, roomId }) => {
            let colorP = (Object(gameRooms[roomId]).players[socket.id]).color
            socket.to(roomId).emit('moveW', { x, y, playerId: socket.id, color: colorP });
        });
        socket.on('moveEndW', ({ roomId }) => {
            //console.log(Object(gameRooms[roomId]).players[socket.id]);
            let colorPl = (Object(gameRooms[roomId]).players[socket.id]).color
            socket.broadcast.emit('moveEndW', { playerId: socket.id, color: colorPl });
        });

        //kill
        socket.on('killed', (playerId) => {
            socket.broadcast.emit('updateOtherPlayer', playerId)

        })

        //change skin and send update in new game
        socket.on('changeSkin', ({ color, id, room }) => {

            //update skin in room
            (Object(gameRooms[room]).players[id]).color = color

            socket.broadcast.emit('changeSkin', ({ color: color, id: id }))
        })


    })
}

function codeGenerator() {
    let code = "";
    let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
function random_item(items) {

    return items[Math.floor(Math.random() * items.length)];

}