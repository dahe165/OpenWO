let io = null;


function initSocket(socketIO) {

    io = socketIO;

}


function getIO() {

    if (!io) {

        throw new Error(
            "Socket.IO belum diinisialisasi."
        );

    }

    return io;

}


module.exports = {
    initSocket,
    getIO
};