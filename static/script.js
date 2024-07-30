document.addEventListener('DOMContentLoaded', function () {
    // Handle Get Itinerary form submission
    document.getElementById('itinerary-form').addEventListener('submit', function (event) {
        event.preventDefault();
        console.log('Form submitted');  // Debugging

        // Display loading message
        const itineraryOutput = document.getElementById('itinerary-output');
        const loadingMessage = document.createElement('p');
        loadingMessage.textContent = 'Getting your personalized itinerary, hang on...';
        itineraryOutput.innerHTML = '';  // Clear previous content
        itineraryOutput.appendChild(loadingMessage);

        // Fetch itinerary data
        fetch('/get-itinerary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                destination: document.getElementById('destination').value,
                start_date: document.getElementById('start_date').value,
                end_date: document.getElementById('end_date').value,
                interests: Array.from(document.querySelectorAll('#interests input:checked')).map(el => el.value),
            }),
        })
        .then(response => {
            console.log('Response Status:', response.status);  // Debugging
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Received itinerary:', data);  // Debugging
            
            // Clear loading message
            itineraryOutput.innerHTML = '';

            // Display itinerary
            const ul = document.createElement('ul');
            data.itinerary.forEach(point => {
                const li = document.createElement('li');
                li.textContent = point;
                ul.appendChild(li);
            });
            itineraryOutput.appendChild(ul);
        })
        .catch(error => {
            console.error('Error fetching itinerary:', error);
            itineraryOutput.innerHTML = `<p>Failed to fetch itinerary. Please try again later. (${error.message})</p>`;
        });
    });

    // Handle Chat form submission
    document.getElementById('chat-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const message = document.getElementById('chat-input').value;
        if (message.trim() === '') return;

        const chatbox = document.getElementById('chatbox');
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = message;
        chatbox.appendChild(messageElement);

        document.getElementById('chat-input').value = '';

        const typingElement = document.createElement('div');
        typingElement.className = 'ai-message';
        typingElement.textContent = 'AI is typing...';
        chatbox.appendChild(typingElement);

        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        })
        .then(response => response.json())
        .then(data => {
            typingElement.textContent = data.response;
        })
        .catch(error => {
            console.error('Error in chat response:', error);
            typingElement.textContent = 'Failed to get response. Please try again later.';
        });
    });

    // Real-Time Updates
    function updateRealTimeUpdates() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;

                fetch('/get-weather', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ latitude: latitude, longitude: longitude }),
                })
                .then(response => response.json())
                .then(data => {
                    const updates = document.getElementById('real-time-updates');
                    updates.innerHTML = `
                        <p>Weather: ${data.weather}</p>
                        <p>Temperature: ${data.temperature}°C</p>
                        <p>Air Quality Index: ${data.air_quality}</p>
                    `;
                })
                .catch(error => console.error('Error fetching weather data:', error));

                fetch('/get-location-message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ latitude: latitude, longitude: longitude }),
                })
                .then(response => response.json())
                .then(data => {
                    const updates = document.getElementById('real-time-updates');
                    updates.innerHTML += `<p>${data.message}</p>`;
                })
                .catch(error => console.error('Error fetching location message:', error));
            });
        }
    }

    updateRealTimeUpdates();
    setInterval(updateRealTimeUpdates, 10000);
});
