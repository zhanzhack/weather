# 🌦️ SkyCast Pro PWA

SkyCast Pro to nowoczesna aplikacja pogodowa zbudowana jako **Progressive Web App (PWA)**. Pozwala na sprawdzanie aktualnej prognozy, wykresów temperatury oraz statystyk pogodowych w czasie rzeczywistym.

## 🚀 Kluczowe funkcje (Zrealizowane punkty projektu)

1.  **Architektura PWA**: Aplikacja posiada plik `manifest.json` oraz `Service Worker`, co umożliwia instalację na smartfonie jako natywną aplikację.
2.  **Źródło danych**: Wykorzystano API [Open-Meteo](https://open-meteo.com/).
3.  **Tryb Offline**: Dzięki wykorzystaniu Service Workera oraz `LocalStorage`, ostatnio pobrane dane są dostępne nawet bez połączenia z internetem.
4.  **Wykresy**: Wizualizacja temperatury godzinowej za pomocą biblioteki `Chart.js`.
5.  **Geolokalizacja**: Możliwość pobrania prognozy na podstawie współrzędnych GPS użytkownika.
6.  **Wyszukiwarka**: Funkcja szukania pogody dla dowolnego miasta na świecie dzięki integracji z systemem geokodowania.
7.  **Ustawienia i Personalizacja**:
    * Zmiana jednostek miary (°C / °F).
    * Lokalizacja interfejsu (Polski / Angielski).
    * Dynamiczna zmiana motywu wizualnego aplikacji.
8.  **Responsywność (Mobile First)**: Pełna optymalizacja dla urządzeń mobilnych (iOS/Android), z uwzględnieniem `safe-area` i dolnych pasków systemowych.
9.  **Social Sharing**: Integracja z systemowym menu udostępniania (Web Share API).

##  Technologia

* **HTML5 / CSS3** (Zmienne CSS, Flexbox, Grid)
* **JavaScript (ES6+)** (Async/Await, Fetch API)
* **Chart.js** — do generowania interaktywnych wykresów
* **Service Worker** — obsługa trybu offline i buforowanie zasobów

##  Jak uruchomić

1. Skopiuj pliki na serwer (lub użyj Live Server w VS Code).
2. Otwórz aplikację w przeglądarce.
3. Na urządzeniu mobilnym wybierz opcję "Dodaj do ekranu głównego", aby zainstalować aplikację.

