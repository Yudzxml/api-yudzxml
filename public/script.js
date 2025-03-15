setInterval(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('time').innerText = timeString;
}, 1000);

document.addEventListener('DOMContentLoaded', function() {
    // Mengambil elemen notifikasi dan tombol penutup
    document.getElementById('welcome-notification').style.display = 'flex';
    
    document.getElementById('close-notification').addEventListener('click', function() {
        document.getElementById('welcome-notification').style.display = 'none';
    });
});

    // Memutar audio latar belakang
    var audio = document.getElementById('sound');

    document.addEventListener('click', function() {
        playAudio();
    });

    document.addEventListener('mousemove', function() {
        playAudio();
    });

    function playAudio() {
        audio.play().catch(function(error) {
            console.log("Audio tidak dapat diputar: ", error);
        });
    }