const { Socket } = require("socket.io");
//require('./constant')
let dead_player = new Map()
let normal_player = new Map()
let imposter_player = new Map()
let test = new Map()
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
let num_user_finish_task = 0;

module.exports = (io) => {
    io.on('connection', (socket) => {


        console.log(socket.id + ' connected');
        num_user_finish_task = 0;
        socket.on('joinRoom', ({ roomkey, name }) => {

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
                    name: name,
                    color: randColor,
                    hat: null,
                    pet: null,
                    pants: null
                }
                roomInfo.color.filter(x => x !== randColor)
            }

            //who is host in room   
            if (Object.keys((roomInfo).players)[0] == socket.id) {
                Object.values((roomInfo).players)[0].host = true;
            }



            roomInfo.numPlayers = Object.keys(roomInfo.players).length;

            //   console.log(roomInfo);

            //in waitingRoo
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
            // try {
            //     console.log('disconecting room', [...socket.rooms][1])
            //     socket.to([...socket.rooms][1]).emit("leave_room", socket.id)
            //     delete gameRooms[[...socket.rooms][1]].players[[...socket.rooms][0]]
            //     gameRooms[[...socket.rooms][1]].numPlayers -= 1
            //     console.log(gameRooms[[...socket.rooms][1]])
            //     if (gameRooms[[...socket.rooms][1]].numPlayers == 0) {
            //         console.log(gameRooms[[...socket.rooms][1]])
            //         delete gameRooms[[...socket.rooms][1]]
            //     }
            // } catch (error) {
            //     console.log(error)
            // }


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
                finish: 0,
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
                finish: 0,
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

        socket.on('ok', ({ roomKey, name }) => {
            //   console.log('when ok');
            const roomInfo = gameRooms[roomKey]
            roomInfo.players[socket.id] = {
                x: 0,
                y: 0,
                role: 0, //0: crew 1: imposter
                host: false,
                playerId: socket.id,
                name: name,
                color: PLAYER_BLUE,
                hat: null,
                pet: null,
                pants: null,
            }


            socket.emit('join')

        })
        //in game
        socket.on('letgo', ({ roomId, imposter, player }) => {
            dead_player.set(roomId, [])
            normal_player.set(roomId, [])
            imposter_player.set(roomId, [])
            test.set(roomId, [-1, false])

            let numPlayers = Object(gameRooms[roomId]).numPlayers

            let idPlayers = Object.keys((gameRooms[roomId].players))
            let list = Object.values((gameRooms[roomId].players))
            let namePlayers = []
            list.forEach(element => {
                namePlayers.push(element.name)
            });

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

            io.in(roomId).emit('gogame', ({ numPlayers, idPlayers, namePlayers, Info }))

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
            // console.log("hehe", [...socket.rooms])
            let colorP = (Object(gameRooms[roomId]).players[socket.id]).color
            //find in room and set position
            let id = socket.id
            // socket.to(roomId).emit('move', { x, y, playerId: socket.id, color: colorP });
            Object(gameRooms[roomId]).players[id].x = x;
            Object(gameRooms[roomId]).players[id].y = y;
            let hat = (Object(gameRooms[roomId]).players[socket.id]).hat
            let pet = (Object(gameRooms[roomId]).players[socket.id]).pet
            let pants = (Object(gameRooms[roomId]).players[socket.id]).pants


            socket.to(roomId).emit('move', { x, y, playerId: socket.id, color: colorP, hat, pet, pants });
        });
        socket.on('moveEnd', ({ roomId, x, y }) => {
            let colorPl = (Object(gameRooms[roomId]).players[socket.id]).color
            let hat = (Object(gameRooms[roomId]).players[socket.id]).hat
            let pet = (Object(gameRooms[roomId]).players[socket.id]).pet
            let pants = (Object(gameRooms[roomId]).players[socket.id]).pants
            socket.to(roomId).emit('moveEnd', { playerId: socket.id, color: colorPl, x, y, hat, pet, pants });

        });
        socket.on('moveW', ({ x, y, roomId }) => {
            let colorP = (Object(gameRooms[roomId]).players[socket.id]).color
            let hat = (Object(gameRooms[roomId]).players[socket.id]).hat
            let pet = (Object(gameRooms[roomId]).players[socket.id]).pet
            let pants = (Object(gameRooms[roomId]).players[socket.id]).pants
            socket.to(roomId).emit('moveW', { x, y, playerId: socket.id, color: colorP, hat, pet, pants });
        });
        socket.on('moveEndW', ({ roomId, x, y }) => {

            let colorPl = (Object(gameRooms[roomId]).players[socket.id]).color
            let hat = (Object(gameRooms[roomId]).players[socket.id]).hat
            let pet = (Object(gameRooms[roomId]).players[socket.id]).pet
            let pants = (Object(gameRooms[roomId]).players[socket.id]).pants
            socket.to(roomId).emit('moveEndW', { playerId: socket.id, color: colorPl, x, y, hat, pet, pants });
        });

        //kill
        socket.on('killed', ({ playerId, roomId }) => {

            let i = normal_player.get(roomId).indexOf(playerId)
            //let j = imposter_player.get(roomId).indexOf(playerId)
            dead_player.get(roomId).push(playerId)
            if (i != -1) {
                let arr = normal_player.get(roomId).filter(item => item !== playerId)
                normal_player.set(roomId, arr)
            }
            let colorKill = (Object(gameRooms[roomId]).players[playerId]).color
            socket.to(roomId).emit('updateOtherPlayer', { playerId: playerId, colorKill: colorKill })
        })

        //change skin and send update in new game
        socket.on('changeSkin', ({ color, hat, pet, pants, id, room }) => {

            //update skin in room

            //   console.log(pants);

            (Object(gameRooms[room]).players[id]).color = color;
            (Object(gameRooms[room]).players[id]).hat = hat ?? null;
            (Object(gameRooms[room]).players[id]).pet = pet ?? null;
            (Object(gameRooms[room]).players[id]).pants = pants ?? null;
            socket.to(room).emit('changeSkin', ({ color: color, hat: hat, pet: pet, pants: pants, id: id }))
        })
        socket.on('open_vote', (roomKey) => {
            io.in(roomKey).emit('open_othervote')
        })
        socket.on('check_dead', (roomId) => {

            socket.to(roomId).emit('dead_list', dead_player.get(roomId))

        })

        // socket.on('finish_task', (roomkey) => {
        //     // gameRooms[roomkey].finish_task = 1;
        //     //console.log(roomkey);
        //     let finish = Object(gameRooms[roomkey].finish)

        //     finish = finish + 1
        //     //  console.log(finish)
        //     gameRooms[roomkey].finish = finish
        //     //console.log(gameRooms[roomkey].finish)

        //     io.in(roomkey).emit('current_player_finish_task', gameRooms[roomkey].finish)

        // }
        // )




        socket.on('vote', (playerId, other_playerId, roomKey) => {
            //    console.log(playerId)
            io.in(roomKey).emit('vote_otherplayer', other_playerId)
            io.in(roomKey).emit('voter_id', playerId)
        })

        socket.on('vote_end', (status, id, roomKey) => {
            switch (status) {
                case 1:
                    // console.log("is imposter")
                    io.in(roomKey).emit('vote_final', 1, id)
                    break;
                case 2:
                    // console.log("is not imposter")
                    io.in(roomKey).emit('vote_final', 2, id)
                    break;
                case 3:
                    // console.log("skipeed ")
                    io.in(roomKey).emit('vote_final', 3, id)
                    break;

                default:
                    break;
            }
        })
        socket.on('send_role', (id, role, roomId) => {
            //     console.log(id,role,roomId)
            if (role == 1) {
                imposter_player.get(roomId).push(id)
            } else {
                normal_player.get(roomId).push(id)
            }
        })
        socket.on('check_', (roomId) => {
            // console.log(normal_player.get(roomId),imposter_player.get(roomId))
            if (imposter_player.get(roomId).length >= normal_player.get(roomId).length) {
                //   console.log("imposter win check")
                test.get(roomId)[0] = 1
            } else if (imposter_player.get(roomId).length == 0) {
                //   console.log("player win check")
                test.get(roomId)[0] = 2
            }
        })
        socket.on("remove", (roomId, id, role) => {
            switch (role) {
                case 1:
                    let arr = imposter_player.get(roomId).filter(item => item !== id)
                    let colorKill = (Object(gameRooms[roomId]).players[id]).color
                    io.emit('updateOtherPlayer', { playerId: id, colorKill: colorKill })
                    imposter_player.set(roomId, arr)

                    //      console.log("player died",normal_player.get(roomId))
                    break;
                case 2:
                    let arr_1 = normal_player.get(roomId).filter(item => item !== id)
                    let colorKill_1 = (Object(gameRooms[roomId]).players[id]).color
                    io.emit('updateOtherPlayer', { playerId: id, colorKill: colorKill_1 })
                    normal_player.set(roomId, arr_1)
                    //  console.log(normal_player.get(roomId))
                    break;

                default:
                    break;
            }
        })
        socket.on("message", (id, name, message, roomKey) => {
            //  console.log(message)
            io.in(roomKey).emit("send", id, name, message)
        })
        socket.on("delete_room", () => {
            delete gameRooms[[...socket.rooms][1]]
            //  console.log(gameRooms)
        })



        setInterval(() => {

            [...test].forEach(value => {
                // console.log(test)
                if (value[1][0] == 1 && value[1][1] == false) {
                    // console.log("imposter win")
                    test.set(value[0], -1, true)
                    io.in(value[0]).emit('end_game', 1)
                    //  gameRooms = gameRooms.filter(function(el) { return el.roomKey !=[...socket.rooms][1] ; }); 

                } else if (value[1][0] == 2 && value[1][1] == false) {
                    // console.log("player win")
                    test.set(value[0], -1, true)
                    io.in(value[0]).emit('end_game', 2)

                    //   gameRooms = gameRooms.filter(function(el) { return el.roomKey !=[...socket.rooms][1] ; }); 

                }
            })

        }, 500)

        socket.on("finish_task", () => {
            // if(total_number_player_finish == total_user) { 
            //     io.emit('end_game', 2)
            // }
            // console.log("hehe", [...socket.rooms][1])
            num_user_finish_task += 1
            io.in([...socket.rooms][1]).emit('current_player_finish_task', num_user_finish_task)
        })

        socket.on('all_player_finish_task', () => {
            // console.log("booo")
            io.to(socket.id).emit('end_game', 2)
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