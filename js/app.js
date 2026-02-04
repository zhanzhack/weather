let myChart = null;
let weatherData = null;
let currentUnit = 'C'; 
let currentLang = 'PL';

const langData = {
    PL: {
        settings: "Ustawienia", unit_label: "Jednostka temp.", lang_label: "Język", theme_label: "Motyw", theme_btn: "Zmień",
        today: "Dzisiaj", tab_today: "DZISIAJ", tab_tomorrow: "JUTRO", tab_14days: "14 DNI", chart_title: "Temperatura godzinowa",
        wind: "Wiatr", hum: "Wilgotność", pres: "Ciśnienie", clouds: "Zachmurzenie", share: "📤 Udostępnij prognozę",
        search: "Szukaj", back: "← Powrót", nav_home: "Home", nav_search: "Szukaj", feels: "Odczuwalna"
    },
    EN: {
        settings: "Settings", unit_label: "Temp. Unit", lang_label: "Language", theme_label: "Theme", theme_btn: "Change",
        today: "Today", tab_today: "TODAY", tab_tomorrow: "TOMORROW", tab_14days: "14 DAYS", chart_title: "Hourly Temperature",
        wind: "Wind", hum: "Humidity", pres: "Pressure", clouds: "Clouds", share: "📤 Share Forecast",
        search: "Search", back: "← Back", nav_home: "Home", nav_search: "Search", feels: "Feels like"
    }
};

// --- ФУНКЦІЇ БОКОВОЇ ПАНЕЛІ ---
function toggleUnit() {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    document.getElementById('unit-btn').innerText = `°${currentUnit}`;
    updateUI('today');
}

function toggleLang() {
    currentLang = currentLang === 'PL' ? 'EN' : 'PL';
    document.getElementById('lang-btn').innerText = currentLang;
    document.querySelectorAll('[data-t]').forEach(el => {
        const key = el.getAttribute('data-t');
        el.innerText = langData[currentLang][key];
    });
    updateUI('today');
}

function toggleTheme() {
    document.body.classList.toggle('alt-theme');
}

// Конвертація
function cToF(temp) {
    return currentUnit === 'C' ? Math.round(temp) : Math.round((temp * 9/5) + 32);
}

// Твої існуючі функції
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
    } catch (err) { console.warn("Offline mode"); }
}

function updateUI(mode) {
    if (!weatherData) return;
    document.getElementById('city-name').innerText = weatherData.cityName;
    const current = weatherData.current;
    
    document.getElementById('temperature').innerText = cToF(current.temperature_2m) + "°";
    document.getElementById('weather-desc').innerText = getWeatherDesc(current.weather_code);
    document.getElementById('feels-like').innerText = `${langData[currentLang].feels} ${cToF(current.apparent_temperature)}°`;
    
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
        renderChart(weatherData.hourly.temperature_2m.slice(startIndex, startIndex + 12));
        tabs[mode === 'today' ? 0 : 1].classList.add('active');
    } else {
        chartSec.style.display = 'none';
        forecastSec.style.display = 'block';
        renderForecastList();
        tabs[2].classList.add('active');
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
                data: temps.filter((_, i) => i % 2 === 0).map(t => cToF(t)),
                borderColor: '#4fd1c5',
                backgroundColor: 'rgba(79, 209, 197, 0.2)',
                fill: true, tension: 0.4
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
                <span>${cToF(weatherData.daily.temperature_2m_max[i])}° / ${cToF(weatherData.daily.temperature_2m_min[i])}°</span>
            </div>`;
    });
}

function getWeatherDesc(code) {
    if (code === 0) return currentLang === 'PL' ? "Czyste niebo" : "Clear Sky";
    return currentLang === 'PL' ? "Zachmurzenie" : "Cloudy";
}

function getWeatherEmoji(code) {
    return code === 0 ? "☀️" : code < 4 ? "⛅" : "☁️";
}

document.getElementById('search-btn').addEventListener('click', async () => {
    const city = document.getElementById('city-input').value;
    const geoResp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=pl&format=json`);
    const geoData = await geoResp.json();
    if (geoData.results) {
        getWeatherData(geoData.results[0].latitude, geoData.results[0].longitude, geoData.results[0].name);
        showPage('home');
    }
});

document.getElementById('geo-btn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(pos => getWeatherData(pos.coords.latitude, pos.coords.longitude));
});

document.getElementById('share-btn').addEventListener('click', async () => {
    try {
        await navigator.share({ title: 'SkyCast Pro', text: `Pogoda: ${cToF(weatherData.current.temperature_2m)}°`, url: window.location.href });
    } catch (err) { alert("Link: " + window.location.href); }
});

window.addEventListener('offline', () => { document.body.style.filter = "grayscale(0.3)"; });
window.addEventListener('online', () => { document.body.style.filter = "none"; });

window.onload = () => {
    const saved = localStorage.getItem('lastWeatherData');
    if (saved) { weatherData = JSON.parse(saved); updateUI('today'); }
    getWeatherData(52.23, 21.01, "Warszawa");
};