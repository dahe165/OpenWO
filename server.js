const expressApp = require("./src/express");

const PORT = process.env.PORT || 3000;

expressApp.listen(PORT, () => {
    console.log(`🚀 OpenWO berjalan di http://localhost:${PORT}`);
});