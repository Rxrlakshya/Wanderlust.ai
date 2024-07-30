from flask import Flask, request, jsonify, render_template, redirect, url_for
import google.generativeai as genai
import requests
import random
import pandas as pd
import logging

app = Flask(__name__, static_folder='static', static_url_path='/static')

GOOGLE_API_KEY = "AIzaSyDpqKm-N1x0Lyzam235kPyMdfDeaDXvj88"
OPEN_WEATHER_API_KEY = "014bc847ccb58ee9516a4c16f596e610"

genai.configure(api_key=GOOGLE_API_KEY)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-itinerary', methods=['POST'])
def get_itinerary():
    try:
        data = request.json
        destination = data.get('destination')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        interests = ', '.join(data.get('interests', []))

        content = f"Plan an itinerary for a trip to {destination} from {start_date} to {end_date} focusing on {interests}."

        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(content)
        response.resolve()

        return jsonify(itinerary=response.text.split('\n'))  # Split response into points
    except Exception as e:
        logging.error(f"Error in get_itinerary: {e}")
        return jsonify(error="Failed to fetch itinerary. Please try again later."), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message')

        content = f"{message}"
        
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(content)
        response.resolve()

        return jsonify(response=response.text)
    except Exception as e:
        logging.error(f"Error in chat: {e}")
        return jsonify(error="Failed to fetch response. Please try again later."), 500

@app.route('/get-weather', methods=['POST'])
def get_weather():
    try:
        data = request.json
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={OPEN_WEATHER_API_KEY}&units=metric"
        air_quality_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={latitude}&lon={longitude}&appid={OPEN_WEATHER_API_KEY}"

        weather_response = requests.get(weather_url).json()
        air_quality_response = requests.get(air_quality_url).json()

        weather = weather_response['weather'][0]['description']
        temperature = weather_response['main']['temp']
        air_quality_index = air_quality_response['list'][0]['main']['aqi']

        return jsonify(weather=weather, temperature=temperature, air_quality=air_quality_index)
    except Exception as e:
        logging.error(f"Error in get_weather: {e}")
        return jsonify(error="Failed to fetch weather data. Please try again later."), 500

@app.route('/get-location-message', methods=['POST'])
def get_location_message():
    try:
        data = request.json
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        messages = [
            f"You are currently at coordinates ({latitude}, {longitude}). Did you know that this area is known for its beautiful scenery?",
            f"At ({latitude}, {longitude}), you can find some amazing local cuisine. Be sure to try it out!",
            f"Exploring the area around ({latitude}, {longitude}) can be very rewarding. Enjoy your travels!"
        ]

        return jsonify(message=random.choice(messages))
    except Exception as e:
        logging.error(f"Error in get_location_message: {e}")
        return jsonify(error="Failed to fetch location message. Please try again later."), 500

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        admin_id = request.form.get('admin_id')
        password = request.form.get('password')
        if admin_id == 'admin' and password == 'admin':
            return redirect(url_for('admin_success'))
        else:
            return render_template('admin.html', error=True)
    return render_template('admin.html')

@app.route('/admin_success')
def admin_success():
    return render_template('admin_success.html')

@app.route('/search_csv', methods=['GET'])
def search_csv():
    try:
        filename = request.args.get('filename')
        query = request.args.get('query')
        df = pd.read_csv(f'{filename}.csv')
        if query:
            df = df[df.apply(lambda row: row.astype(str).str.contains(query, case=False).any(), axis=1)]
        return render_template('admin_csv.html', tables=[df.to_html(classes='data')], titles=df.columns.values, filename=filename)
    except Exception as e:
        logging.error(f"Error in search_csv: {e}")
        return "Error processing CSV file. Please try again later.", 500

if __name__ == '__main__':
    app.run(debug=True)
