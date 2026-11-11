function getCurrentTime() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Menambah 1 karena bulan dimulai dari 0
    const day = String(currentDate.getDate()).padStart(2, '0');
    // Mendapatkan jam, menit, dan detik dari objek Date
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');

    // Membuat objek dengan properti jam, menit, dan detik
    const timeObject = {
        year: year,
        month: month,
        day: day,
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };

    return timeObject;
}
function formatDate(tanggalStr) {
    // Memecah string tanggal berdasarkan karakter '/'
    const bagian = tanggalStr.split('/');

    if (bagian.length !== 3) return 'Format tanggal tidak valid';

    const hari = bagian[0];
    const bulan = bagian[1];
    const tahun = bagian[2];

    // Menggabungkan kembali dengan urutan tahun-bulan-hari
    return `${tahun}-${bulan}-${hari}`;
}
module.exports = {
    getCurrentTime,
    formatDate
}