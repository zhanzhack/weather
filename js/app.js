if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log("Service Worker Zarejestrowany"))
        .catch((err) => console.log("Błąd rejestracji SW:", err));
}

window.addEventListener('online', () => {
    document.getElementById('offline-msg').style.display = 'none';
});
window.addEventListener('offline', () => {
    document.getElementById('offline-msg').style.display = 'block';
});

const API_KEY = 'aea43553535c28c082a4485dc764a369'; 

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
}

async function getWeather(city) {
    try {
        const response = await fetch(
            // Змінено lang=uk на lang=pl
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=pl`
        );
        
        if (!response.ok) throw new Error("Nie znaleziono miasta");
        
        const data = await response.json();
        updateUI(data); 
    } catch (error) {
        alert("Błąd: " + error.message);
    }
}

function updateUI(data) {
    document.getElementById('city-name').innerText = data.name;
    document.getElementById('temperature').innerText = Math.round(data.main.temp) + "°";
    document.getElementById('weather-desc').innerText = data.weather[0].description;
    
    // Додаємо нові дані
    document.getElementById('humidity').innerText = data.main.humidity + "%";
    document.getElementById('wind').innerText = data.wind.speed + " m/s";
    
    // Оновлюємо стилі кнопок в меню
    updateNav(activePage);
    showPage('home');
}
async function getMyLocation() {
    if (!navigator.geolocation) {
        return alert("Geolokalizacja nie jest wspierana przez Twoją przeglądarkę");
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        const response = await fetch(
            // Змінено lang=uk на lang=pl
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pl`
        );
        const data = await response.json();
        updateUI(data);
    }, () => {
        alert("Nie udało się uzyskać dostępu do lokalizacji");
    });
}

async function shareWeather() {
    const city = document.getElementById('city-name').innerText;
    const temp = document.getElementById('temperature').innerText;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Moja pogoda',
                text: `Cześć! W mieście ${city} jest teraz ${temp}. Sprawdź w SkyCast!`,
                url: window.location.href
            });
        } catch (err) {
            console.log("Użytkownik anulował udostępnianie");
        }
    } else {
        alert("Twoja przeglądarka nie obsługuje funkcji udostępniania (Share API)");
    }
}

document.getElementById('search-btn').addEventListener('click', () => {
    const city = document.getElementById('city-input').value;
    if (city) getWeather(city);
});

document.getElementById('geo-btn').addEventListener('click', getMyLocation);
document.getElementById('share-btn').addEventListener('click', shareWeather);

window.onload = getMyLocation;