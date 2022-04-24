let gameRooms = [
    // roomkey: {
    //     // users: [],
    //     // randomTasks: [],
    //     // scores: [],
    //     // gameScore: 0,
    //     players: {},
    //     numPlayers: 0
    // }
]
module.exports = (io) => {

    io.on('connection', (socket) => {

        console.log(socket.id + ' connected');

        //  socket.on('newGameCreated',(data)=>{
        //    console.log(data.gameId);
        //     listPlayer.push(data.mySocketId) 
        //     socket.join((data.gameId).toString())

        //     io.sockets.to(data.gameId.toString()).emit('connectToRoom', "You are in room no. "+data.gameId);


        //   })

        socket.on('joinRoom', (roomkey) => {

            socket.join(roomkey)
            // console.log('joined');

            const roomInfo = gameRooms[roomkey]
            roomInfo.players[socket.id] = {
                x: 400,
                y: 300,
                playerId: socket.id
            }

            console.log(roomInfo);
            console.log('break');

            roomInfo.numPlayers = Object.keys(roomInfo.players).length;

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
        //animation
        socket.on('move', ({ x, y, roomId }) => {
            console.log({ x, y, roomId: roomId });
            //find in room and set position
            let id = socket.id
            Object(gameRooms[roomId]).players[id].x = x;
            Object(gameRooms[roomId]).players[id].y = y;

            console.log(gameRooms[roomId]);

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