const { Socket } = require("socket.io");
//require('./constant')
let dead_player = new Map()
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
const PLAYER_BLUE = "player_base_blue";
const PLAYER_RED = "player_base_red";
const PLAYER_BLUE_DARK = "player_base_blue_dark";
const PLAYER_BLUE_LIGHT = "player_base_blue_light";
const PLAYER_GRAY_DARK = "player_base_gray_dark";
const PLAYER_GRAY_LIGHT = "player_base_gray_light";
const PLAYER_GREEN_DARK = "player_base_green_dark";
const PLAYER_GREEN_LIGHT = "player_base_green_light";
const PLAYER_ORANGE = "player_base_orange";
const PLAYER_PURPLE = "player_base_purple";
const PLAYER_YELLOW = "player_base_yellow";
const PLAYER_PINK = "player_base_pink";
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
            // console.log(roomInfo);
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
        socket.on("disconnecting", () => {
            console.log('disconecting')

            io.socketsLeave([...socket.rooms][1]);
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
                    PLAYER_RED,
                    PLAYER_BLUE_DARK,
                    PLAYER_BLUE_LIGHT,
                    PLAYER_GRAY_DARK,
                    PLAYER_GRAY_LIGHT,
                    PLAYER_GREEN_DARK,
                    PLAYER_GREEN_LIGHT,
                    PLAYER_ORANGE,
                    PLAYER_PURPLE,
                    PLAYER_YELLOW,
                    PLAYER_PINK]
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
                color: [
                    PLAYER_RED,
                    PLAYER_BLUE_DARK,
                    PLAYER_BLUE_LIGHT,
                    PLAYER_GRAY_DARK,
                    PLAYER_GRAY_LIGHT,
                    PLAYER_GREEN_DARK,
                    PLAYER_GREEN_LIGHT,
                    PLAYER_ORANGE,
                    PLAYER_PURPLE,
                    PLAYER_YELLOW,
                    PLAYER_PINK]
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
                color: PLAYER_BLUE
            }

            //console.log(gameRooms[roomkey]);
            socket.emit('join')

        })
        //in game
        socket.on('letgo', ({ roomId, imposter, player }) => {
            dead_player.set(roomId, [])
            // console.log(imposter);
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
            //  console.log('move End');
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
        socket.on('killed', ({ playerId, roomId }) => {
            // console.log(playerId);
            dead_player.get(roomId).push(playerId)
            let colorKill = (Object(gameRooms[roomId]).players[playerId]).color
            socket.broadcast.emit('updateOtherPlayer', { playerId: playerId, colorKill: colorKill })
            console.log(dead_player)
        })

        //change skin and send update in new game
        socket.on('changeSkin', ({ color, id, room }) => {

            //update skin in room
            (Object(gameRooms[room]).players[id]).color = color

            socket.broadcast.emit('changeSkin', ({ color: color, id: id }))
        })
        socket.on('open_vote', () => {
            socket.broadcast.emit('open_othervote')
        })
        socket.on('check_dead', (roomId) => {
            console.log(roomId)
            socket.emit('dead_list', dead_player.get(roomId))

        })
        socket.on('vote', (playerId, other_playerId) => {
            console.log(playerId)
            io.emit('vote_otherplayer', other_playerId)
            io.emit('voter_id', playerId)
        })

        socket.on('vote_end', (status, id) => {
            switch (status) {
                case 1:
                    console.log("is imposter")
                    io.emit('vote_final', 1, id)
                    break;
                case 2:
                    console.log("is not imposter")
                    io.emit('vote_final', 2, id)
                    break;
                case 3:
                    console.log("skipeed ")
                    io.emit('vote_final', 3, id)
                    break;

                default:
                    break;
            }
        })
    })

}
//setInterval(refreshRoom(), 50000); // delete room if nothing in


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
function refreshRoom() {
    for (let i = 0; i < gameRooms.length; i++) {
        if (gameRooms[i].numPlayers == 1) {
            delete gameRooms[i];
        }

    }
}