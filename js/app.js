let myChart = null;
let weatherData = null;


function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}


function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
}


async function getWeatherData(lat, lon, cityName = "Moja lokalizacja") {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m,cloud_cover&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error();
        
        weatherData = await resp.json();
        weatherData.cityName = cityName;
        
        
        localStorage.setItem('lastWeatherData', JSON.stringify(weatherData));
        
        updateUI('today');
    } catch (err) {
        console.warn("Tryb offline: Dane załadowane z pamięci.");
    }
}

function updateUI(mode) {
    if (!weatherData) return;
    document.getElementById('city-name').innerText = weatherData.cityName;
    
    const current = weatherData.current;
    document.getElementById('temperature').innerText = Math.round(current.temperature_2m) + "°";
    document.getElementById('weather-desc').innerText = getWeatherDesc(current.weather_code);
    document.getElementById('feels-like').innerText = `Odczuwalna ${Math.round(current.apparent_temperature)}°`;
    document.getElementById('humidity').innerText = current.relative_humidity_2m + "%";
    document.getElementById('wind').innerText = Math.round(current.wind_speed_10m) + " km/h";
    document.getElementById('pressure').innerText = Math.round(current.pressure_msl) + " hPa";
    document.getElementById('clouds').innerText = current.cloud_cover + "%";
    document.getElementById('weather-icon-large').innerText = getWeatherEmoji(current.weather_code);

    updateView(mode);
}

function updateView(mode) {
    const chartSec = document.getElementById('chart-section');
    const forecastSec = document.getElementById('forecast-section');
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));

    if (mode === 'today' || mode === 'tomorrow') {
        chartSec.style.display = 'block';
        forecastSec.style.display = 'none';
        const startIndex = mode === 'today' ? 0 : 24;
        renderChart(weatherData.hourly.temperature_2m.slice(startIndex, startIndex + 12), mode);
        tabs[mode === 'today' ? 0 : 1].classList.add('active');
    } else if (mode === '14days') {
        chartSec.style.display = 'none';
        forecastSec.style.display = 'block';
        renderForecastList();
        tabs[2].classList.add('active');
    }
}

function renderChart(temps, mode) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    if (myChart) myChart.destroy();
    const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: temps.filter((_, i) => i % 2 === 0),
                borderColor: '#4fd1c5',
                backgroundColor: 'rgba(79, 209, 197, 0.2)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: '#a0aec0' }, grid: { display: false } }, y: { display: false } }
        }
    });
}

function renderForecastList() {
    const list = document.getElementById('daily-list');
    list.innerHTML = '';
    weatherData.daily.time.forEach((date, i) => {
        const day = new Date(date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric' });
        list.innerHTML += `
            <div class="forecast-item">
                <span>${day}</span>
                <span style="font-size: 1.2rem;">${getWeatherEmoji(weatherData.daily.weather_code[i])}</span>
                <span>${Math.round(weatherData.daily.temperature_2m_max[i])}° / ${Math.round(weatherData.daily.temperature_2m_min[i])}°</span>
            </div>`;
    });
}

function getWeatherDesc(code) {
    if (code === 0) return "Czyste niebo";
    if (code < 4) return "Częściowe zachmurzenie";
    if (code < 70) return "Opady deszczu";
    return "Zachmurzenie";
}

function getWeatherEmoji(code) {
    if (code === 0) return "☀️";
    if (code < 4) return "⛅";
    if (code < 70) return "🌧️";
    return "☁️";
}


document.getElementById('search-btn').addEventListener('click', async () => {
    const city = document.getElementById('city-input').value;
    if(!city) return;
    const geoResp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=pl&format=json`);
    const geoData = await geoResp.json();
    if (geoData.results) {
        const res = geoData.results[0];
        getWeatherData(res.latitude, res.longitude, res.name);
        showPage('home');
    }
});

document.getElementById('geo-btn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(pos => getWeatherData(pos.coords.latitude, pos.coords.longitude));
});


document.getElementById('share-btn').addEventListener('click', async () => {
    const shareData = {
        title: 'SkyCast Pro',
        text: `Aktualna pogoda w ${weatherData.cityName}: ${Math.round(weatherData.current.temperature_2m)}°C. Sprawdź moją aplikację!`,
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            alert("Udostępnianie nie jest wspierane w tej przeglądarce. Skopiuj link: " + window.location.href);
        }
    } catch (err) {
        console.log("Błąd udostępniania:", err);
    }
});


window.addEventListener('offline', () => {
    document.getElementById('weather-desc').innerHTML = "<span style='color: #ffcc00;'>⚠️ Tryb Offline (Dane z pamięci)</span>";
    document.body.style.filter = "grayscale(0.3)";
});

window.addEventListener('online', () => {
    document.getElementById('weather-desc').innerHTML = "Z powrotem online";
    document.body.style.filter = "none";
    getWeatherData(52.23, 21.01, weatherData ? weatherData.cityName : "Warszawa");
});

window.onload = () => {
    const saved = localStorage.getItem('lastWeatherData');
    if (saved) {
        weatherData = JSON.parse(saved);
        updateUI('today');
    }
    getWeatherData(52.23, 21.01, "Warszawa");
};