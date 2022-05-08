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
module.exports = (io) => {

    io.on('connection', (socket) => {

        console.log(socket.id + ' connected');

        socket.on('joinRoom', (roomkey) => {

            socket.join(roomkey)
            // console.log('joined');

            const roomInfo = gameRooms[roomkey]
            roomInfo.players[socket.id] = {
                x: 0,
                y: 0,
                role: 0, //0: crew 1: imposter
                host: false,
                playerId: socket.id,
                name: ''
            }

            //who is host in room   
            if (Object.keys((roomInfo).players)[0] == socket.id) {
                Object.values((roomInfo).players)[0].host = true;
            }



            //  console.log('break');

            roomInfo.numPlayers = Object.keys(roomInfo.players).length;

            console.log(roomInfo);

            //in waitingRoom
            socket.emit('setState', roomInfo)

            // socket.emit('joined')

            //list player trong 1 room
            socket.emit('currentPlayers', {
                players: roomInfo.players,
                numPlayers: roomInfo.numPlayers
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
                numPlayers: 0
            };
            //console.log(gameRooms);
            socket.emit("roomCreated", key);
        });
        socket.on('ok', () => {
            socket.emit('join')
        })
        //in game
        socket.on('letgo', ({ roomId, imposter, player }) => {
            console.log(roomId);
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

            //emit role 
            //console.log(gameRooms[roomId]);

            //console.log(playerInfo);
            io.in(roomId).emit('gogame', ({ numPlayers, idPlayers }))

        })

        socket.on('whatRole', (roomId) => {
            //   console.log(Object(gameRooms[roomId]).players);
            let isRole = (Object(gameRooms[roomId]).players)[socket.id].role
            // console.log(isRole);
            io.to(socket.id).emit('roleIs', isRole);
        })



        socket.on('getRandomRoom', () => {
            let allRoomId = Object.keys(gameRooms);
            let random = random_item(allRoomId);
            io.to(socket.id).emit('randomRoom', (random))
        })
        socket.on('move', ({ x, y, roomId }) => {
            //    console.log({ x, y, roomId: roomId });
            //find in room and set position
            let id = socket.id
            Object(gameRooms[roomId]).players[id].x = x;
            Object(gameRooms[roomId]).players[id].y = y;

            //     console.log(gameRooms[roomId]);

            socket.to(roomId).emit('move', { x, y, playerId: socket.id });
        });
        socket.on('moveEnd', (roomId) => {
            socket.broadcast.emit('moveEnd', { playerId: socket.id });
        });
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