const API_KEY = '55ca3a8862f92f698d287130dfc10599'; // Твій ключ
let myChart = null;

// Функція перемикання сторінок
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    
    // Оновлюємо активну кнопку в меню
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if(pageId === 'home') document.querySelector('button[onclick*="home"]').classList.add('active');
}

// Отримання погоди
async function getWeather(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=pl`);
        if (!response.ok) throw new Error("Nie znaleziono miasta");
        const data = await response.json();
        updateUI(data);
    } catch (err) {
        alert(err.message);
    }
}

function updateUI(data) {
    document.getElementById('city-name').innerText = data.name;
    document.getElementById('temperature').innerText = Math.round(data.main.temp) + "°";
    document.getElementById('weather-desc').innerText = data.weather[0].description;
    document.getElementById('feels-like').innerText = `Odczuwalna ${Math.round(data.main.feels_like)}°`;
    document.getElementById('humidity').innerText = data.main.humidity + "%";
    document.getElementById('wind').innerText = Math.round(data.wind.speed * 3.6) + " km/h";
    document.getElementById('pressure').innerText = data.main.pressure + " hPa";
    document.getElementById('clouds').innerText = data.clouds.all + "%";
    
    // Оновлюємо іконку
    const iconCode = data.weather[0].icon;
    document.getElementById('main-icon').src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    renderChart(data.main.temp);
    showPage('home');
}

function renderChart(currentTemp) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    if (myChart) myChart.destroy();

    // Створюємо трохи рандомний графік навколо поточної температури для візуалізації
    const labels = ['12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const temps = [currentTemp - 1, currentTemp, currentTemp + 2, currentTemp + 1, currentTemp - 2, currentTemp - 3];

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: temps,
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
            scales: {
                x: { ticks: { color: '#a0aec0' }, grid: { display: false } },
                y: { display: false }
            }
        }
    });
}

// Геолокація
function getMyLocation() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=pl`);
        const data = await resp.json();
        updateUI(data);
    });
}

// Слухачі подій
document.getElementById('search-btn').addEventListener('click', () => {
    const city = document.getElementById('city-input').value;
    if(city) getWeather(city);
});

document.getElementById('geo-btn').addEventListener('click', getMyLocation);

document.getElementById('share-btn').addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: 'SkyCast Pogoda',
            text: `W ${document.getElementById('city-name').innerText} jest teraz ${document.getElementById('temperature').innerText}`,
            url: window.location.href
        });
    }
});

// Запуск при завантаженні
window.onload = getMyLocation;

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}