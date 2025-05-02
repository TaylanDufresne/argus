const Agent = require("./Agent.js")


class WeatherAgent extends Agent {

    constructor(props, id, begin, repeat) {
	super(`WeatherAgent-${props.location}`, id, begin, repeat)
	this.location = props.location
	this.offset = +props.offset
    }

    async run() {

	const weather = await this.get_weather()
	const day = this.calculate_day()

	const formatted_weather = this.parse_weather(weather, day)

	if(!this.downstream_agent) return formatted_weather

	else{
	    try{
		this.send_downstream(formatted_weather)
	    }
	    catch{
		this.send_downstream(`${this.name} Error fetching weather.`)
	    }
	}
    }

    async receive(data){
	this.run();
    }


    async get_weather() {
	return fetch(`https://wttr.in/${this.location}?format=j1`)
	    .then(response => response.json())
	    .then(data => data.weather)
    }

    parse_weather(weather, day) {
	for (let data of weather) {
	    if (data.date === day) {

		let obj = {
		    "high_temp": data.maxtempC,
		    "low_temp": data.mintempC,
		    "snow": data.totalSnow_cm,
		    "sun_hours": data.sunHour
		}
		return obj
	    }
	}
    }

    calculate_day() {

	const date = new Date()
	date.setDate(date.getDate() + this.offset)

	const day = date.getDate()
	const month = date.getMonth() + 1
	const year = date.getFullYear()

	
	const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

	return formattedDate

    }

    describe(){
	return "WeatherAgents collect weather data from wttr.in. They require a location, and provide the high temp, low temp (both as Celsius), precipitation and daylight hours. The source (wttr.in) provides more information - this Agent may be altered in the future to better make use of it"

    }
    
}

module.exports = WeatherAgent;
