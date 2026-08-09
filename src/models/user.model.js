const users = [

    {
        id: 1,
        nama: "Dahe Ugi",
        username: "dahe",
        role: "asman"
    },

    {
        id: 2,
        nama: "Budi",
        username: "budi",
        role: "pelapor"
    },

    {
        id: 3,
        nama: "Andi",
        username: "andi",
        role: "teknisi"
    },

    {
        id: 4,
        nama: "Manager",
        username: "manager",
        role: "manager"
    }

];


function getAll() {

    return users.map(user => ({
        ...user
    }));

}


function findByUsername(username) {

    return users.find(
        user => user.username === username
    );

}


function findById(id) {

    return users.find(
        user => user.id === id
    );

}


module.exports = {

    getAll,

    findByUsername,

    findById

};