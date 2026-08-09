function formatRelativeTime(date) {

    const now = new Date();
    const target = new Date(date);

    const diff = now - target;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return "Baru saja";
    }

    if (minutes < 60) {
        return `${minutes} menit lalu`;
    }

    if (hours < 24) {
        return `${hours} jam lalu`;
    }

    if (days === 1) {
        return "Kemarin";
    }

    if (days < 7) {
        return `${days} hari lalu`;
    }

    return target.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

module.exports = {
    formatRelativeTime
};