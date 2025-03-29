// Using WeatherStack API
const apiKey = '4d2f0c11ec5792e7788866e31e64d40a'; // WeatherStack API key (free tier)
const loadingSpinner = document.getElementById('loadingSpinner');
const apiErrorMessage = document.getElementById('apiErrorMessage');
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

// Function to format timestamps to readable time
const formatTime = (timeStr) => {
  if (!timeStr) return "--";
  return timeStr;
};

// Function to show loading state
const showLoading = () => {
  loadingSpinner.classList.remove('d-none');
  apiErrorMessage.classList.add('d-none');
};

// Function to hide loading state
const hideLoading = () => {
  loadingSpinner.classList.add('d-none');
};

// Function to get cached data from localStorage
const getCachedWeatherData = (city) => {
  const cachedData = localStorage.getItem(`weather_${city.toLowerCase()}`);
  if (!cachedData) return null;
  
  const { data, timestamp } = JSON.parse(cachedData);
  // Check if cache is still valid (less than 30 minutes old)
  if (Date.now() - timestamp < CACHE_EXPIRY_TIME) {
    return data;
  }
  return null;
};

// Function to cache weather data
const cacheWeatherData = (city, data) => {
  const cacheData = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(`weather_${city.toLowerCase()}`, JSON.stringify(cacheData));
};

// Function to get weather for a city
const getWeather = (city) => {
  cityName.innerHTML = city;

  showLoading();
  
  // Check if we have cached data
  const cachedData = getCachedWeatherData(city);
  if (cachedData) {
    updateWeatherUI(cachedData);
    hideLoading();
    return;
  }
  
  fetch(`https://api.weatherstack.com/current?access_key=${apiKey}&query=${city}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      hideLoading();
      
      // Check if data is valid
      if (data.success === false) {
        throw new Error(data.error.info || "API error");
      }
      
      // Cache the data
      cacheWeatherData(city, data);
      
      // Update UI
      updateWeatherUI(data);
    })
    .catch((err) => {
      console.error(err);
      hideLoading();
      apiErrorMessage.classList.remove('d-none');
    });
};

// Function to update the UI with weather data
const updateWeatherUI = (data) => {
  // Basic weather info
  temp.innerHTML = Math.round(data.current.temperature) || "--";
  feels_like.innerHTML = Math.round(data.current.feelslike) || "--";
  max_temp.innerHTML = Math.round(data.current.temperature + 3) || "--"; // Approximation
  min_temp.innerHTML = Math.round(data.current.temperature - 3) || "--"; // Approximation
  
  // Weather description and icon
  if (data.current.weather_descriptions && data.current.weather_descriptions.length > 0) {
    weather_desc.innerHTML = data.current.weather_descriptions[0];
  }
  
  // Wind data
  wind_speed.innerHTML = (data.current.wind_speed).toFixed(1) || "--";
  wind_degrees.innerHTML = data.current.wind_degree || "--";
  wind_dir.innerHTML = data.current.wind_dir || "--";
  
  // Other atmospheric data
  const cloudPctElement = document.getElementById('cloud_pct');
  if (cloudPctElement) {
    cloudPctElement.textContent = data.current.cloudcover !== undefined ? data.current.cloudcover : "--";
  }
  humidity.innerHTML = data.current.humidity || "--";
  pressure.innerHTML = data.current.pressure || "--";
  visibility.innerHTML = data.current.visibility || "--";
  
  // Astro data (sun and moon)
  if (data.current.astro) {
    sunrise.innerHTML = data.current.astro.sunrise || "--";
    sunset.innerHTML = data.current.astro.sunset || "--";
    moonrise.innerHTML = data.current.astro.moonrise || "--";
    moonset.innerHTML = data.current.astro.moonset || "--";
    moon_phase.innerHTML = data.current.astro.moon_phase || "--";
    const moon_illumination = document.getElementById('moon_illumination')
    if (moon_illumination) {
      moon_illumination.textContent = data.current.astro.moon_illumination !== undefined ? data.current.astro.moon_illumination : "--";
    }
  }
  
  // Air quality
  if (data.current.air_quality) {
    const aqiValue = data.current.air_quality["us-epa-index"];
    let aqiClass = "bg-success";
    let aqiText = "Good";
    
    if (aqiValue === 2) {
      aqiClass = "bg-warning text-dark";
      aqiText = "Moderate";
    } else if (aqiValue === 3) {
      aqiClass = "bg-orange text-white";
      aqiText = "Unhealthy for Sensitive";
    } else if (aqiValue >= 4) {
      aqiClass = "bg-danger";
      aqiText = "Unhealthy";
    }
    
    air_quality.innerHTML = aqiText;
    air_quality.className = `badge rounded-pill ${aqiClass}`;
  }
};

// Function to update city info in the table
const updateCityInfo = (city, index) => {
  // Check if we have cached data
  const cachedData = getCachedWeatherData(city);
  if (cachedData) {
    updateCityTableRow(cachedData, index);
    return;
  }
  
  fetch(`https://api.weatherstack.com/current?access_key=${apiKey}&query=${city}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Check if data is valid
      if (data.success === false) {
        throw new Error(data.error.info || "API error");
      }
      
      // Cache the data
      cacheWeatherData(city, data);
      
      // Update the table row
      updateCityTableRow(data, index);
    })
    .catch((err) => {
      console.error(err);
      document.getElementById(`temp${index}`).innerHTML = "Error";
    });
};

// Function to update a table row with weather data
const updateCityTableRow = (data, index) => {
  document.getElementById(`cloud_pct${index}`).textContent = data.current.cloudcover !== undefined ? data.current.cloudcover : "--";
  document.getElementById(`feels_like${index}`).innerHTML = Math.round(data.current.feelslike) || "--";
  document.getElementById(`humidity${index}`).innerHTML = data.current.humidity || "--";
  document.getElementById(`temp${index}`).innerHTML = Math.round(data.current.temperature) || "--";
  document.getElementById(`wind_speed${index}`).innerHTML = (data.current.wind_speed).toFixed(1) || "--";
};

// Add event listener for search button
document.getElementById('submit').addEventListener('click', () => {
    const cityInput = document.getElementById('city');
    const searchError = document.getElementById('searchError');
    
    if (!cityInput.value.trim()) {
        // Show error if input is empty
        searchError.classList.remove('d-none');
        return;
    }
    
    // Hide error message if it was previously shown
    searchError.classList.add('d-none');
    
    // Get weather for the entered city
    getWeather(cityInput.value);
});

// Also listen for Enter key in the input field
document.getElementById('city').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('submit').click();
    }
});

// Initial weather data for default city (Kolkata)
getWeather("Kolkata");

// Load data for other cities
updateCityInfo("kolkata", 1);
updateCityInfo("mumbai", 2);
updateCityInfo("delhi", 3);
