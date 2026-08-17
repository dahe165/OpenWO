const http = require("http");

const expressApp =
    require("./src/express");

const {
    initSocket
} = require("./src/socket");

const PORT =
    process.env.PORT || 3000;


// ==============================
// HTTP SERVER
// ==============================

const server =
    http.createServer(
        expressApp
    );


// ==============================
// SOCKET.IO
// ==============================

const {
    Server
} = require("socket.io");

const io =
    new Server(server);


// ==============================
// HUBUNGKAN SOCKET KE MODUL
// ==============================

initSocket(io);


// ==============================
// CLIENT TERHUBUNG
// ==============================

io.on(
    "connection",
    socket => {

        console.log(
            "🟢 Socket.IO terhubung:",
            socket.id
        );

    }
);


// ==============================
// START SERVER
// ==============================

server.listen(
    PORT,
    () => {

        console.log(
            `🚀 OpenWO berjalan di http://localhost:${PORT}`
        );

    }
);