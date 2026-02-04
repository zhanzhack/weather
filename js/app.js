let myChart = null;
let weatherData = null;
let currentUnit = 'C'; 
let currentLang = 'PL';

const translations = {
    PL: {
        settings: "Ustawienia", unit: "Jednostka", language: "Język", theme: "Motyw", change: "Zmień",
        today_label: "Dzisiaj", tab_today: "DZISIAJ", tab_tomorrow: "JUTRO", tab_14days: "14 DNI",
        hourly_title: "Temperatura godzinowa", wind: "Wiatr", humidity: "Wilgotność",
        pressure: "Ciśnienie", clouds: "Zachmurzenie", share_btn: "📤 Udostępnij prognozę",
        search_btn: "Szukaj", back: "← Powrót", nav_home: "Home", nav_search: "Szukaj"
    },
    EN: {
        settings: "Settings", unit: "Unit", language: "Language", theme: "Theme", change: "Change",
        today_label: "Today", tab_today: "TODAY", tab_tomorrow: "TOMORROW", tab_14days: "14 DAYS",
        hourly_title: "Hourly Temperature", wind: "Wind", humidity: "Humidity",
        pressure: "Pressure", clouds: "Clouds", share_btn: "📤 Share Forecast",
        search_btn: "Search", back: "← Back", nav_home: "Home", nav_search: "Search"
    }
};

// --- ФУНКЦІЇ МЕНЮ ---
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function toggleUnit() {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    document.getElementById('unit-toggle').innerText = `°${currentUnit}`;
    updateUI('today');
}

function toggleLang() {
    currentLang = currentLang === 'PL' ? 'EN' : 'PL';
    document.getElementById('lang-toggle').innerText = currentLang;
    
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
    });
    updateUI('today');
}

function toggleTheme() {
    document.body.classList.toggle('theme-glass');
}

// --- ЛОГІКА ПОГОДИ ---
async function getWeatherData(lat, lon, cityName = "Moja lokalizacja") {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m,cloud_cover&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const resp = await fetch(url);
        weatherData = await resp.json();
        weatherData.cityName = cityName;
        localStorage.setItem('lastWeatherData', JSON.stringify(weatherData));
        updateUI('today');
    } catch (err) { console.warn("Offline mode"); }
}

function convertTemp(temp) {
    return currentUnit === 'C' ? Math.round(temp) : Math.round((temp * 9/5) + 32);
}

function updateUI(mode) {
    if (!weatherData) return;
    document.getElementById('city-name').innerText = weatherData.cityName;
    
    const current = weatherData.current;
    document.getElementById('temperature').innerText = convertTemp(current.temperature_2m) + "°";
    document.getElementById('weather-desc').innerText = getWeatherDesc(current.weather_code);
    
    const feelsText = currentLang === 'PL' ? 'Odczuwalna' : 'Feels like';
    document.getElementById('feels-like').innerText = `${feelsText} ${convertTemp(current.apparent_temperature)}°`;
    
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
    if (mode === 'today' || mode === 'tomorrow') {
        chartSec.style.display = 'block';
        forecastSec.style.display = 'none';
        const startIndex = mode === 'today' ? 0 : 24;
        renderChart(weatherData.hourly.temperature_2m.slice(startIndex, startIndex + 12));
    } else {
        chartSec.style.display = 'none';
        forecastSec.style.display = 'block';
        renderForecastList();
    }
}

function renderChart(temps) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
                data: temps.filter((_, i) => i % 2 === 0).map(t => convertTemp(t)),
                borderColor: '#4fd1c5',
                fill: true,
                backgroundColor: 'rgba(79, 209, 197, 0.1)',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false } } }
    });
}

function renderForecastList() {
    const list = document.getElementById('daily-list');
    list.innerHTML = '';
    weatherData.daily.time.forEach((date, i) => {
        const day = new Date(date).toLocaleDateString(currentLang === 'PL' ? 'pl-PL' : 'en-US', { weekday: 'short', day: 'numeric' });
        list.innerHTML += `
            <div class="forecast-item">
                <span>${day}</span>
                <span>${getWeatherEmoji(weatherData.daily.weather_code[i])}</span>
                <span>${convertTemp(weatherData.daily.temperature_2m_max[i])}° / ${convertTemp(weatherData.daily.temperature_2m_min[i])}°</span>
            </div>`;
    });
}

function getWeatherDesc(code) {
    const desc = {
        PL: { 0: "Czyste niebo", 3: "Pochmurno", 61: "Deszcz" },
        EN: { 0: "Clear sky", 3: "Cloudy", 61: "Rain" }
    };
    return desc[currentLang][code] || (currentLang === 'PL' ? "Zachmurzenie" : "Cloudy");
}

function getWeatherEmoji(code) {
    return code === 0 ? "☀️" : code < 4 ? "⛅" : "🌧️";
}

// Пошук
document.getElementById('search-btn').addEventListener('click', async () => {
    const city = document.getElementById('city-input').value;
    const geoResp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=pl&format=json`);
    const geoData = await geoResp.json();
    if (geoData.results) {
        getWeatherData(geoData.results[0].latitude, geoData.results[0].longitude, geoData.results[0].name);
        showPage('home');
    }
});

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
}

document.getElementById('geo-btn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(pos => getWeatherData(pos.coords.latitude, pos.coords.longitude));
});

window.onload = () => {
    const saved = localStorage.getItem('lastWeatherData');
    if (saved) { weatherData = JSON.parse(saved); updateUI('today'); }
    getWeatherData(52.23, 21.01, "Warszawa");
};