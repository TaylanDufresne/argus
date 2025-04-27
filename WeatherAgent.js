const Agent = require("./Agent.js")


class WeatherAgent extends Agent {

	constructor(location, id, offset, begin, repeat, downstreamAgent = null) {
		super(`WeatherAgent-${location}`, id, begin, repeat)
		this.location = location
		this.offset = offset
		this.downstreamAgent = downstreamAgent
	}

	async run() {
	    // console.log(`Weather-Agent-${location} requesting and sending`) 
	    if (!this.downstreamAgent){
		return this.get_weather()
			.then(weather => {
			    return this.parse_weather(weather, this.calculate_day())
		})
	    }
	    else{
			this.downstreamAgent.downstream(
				this.get_weather()
					.then(weather => {
						return this.parse_weather(weather, this.calculate_day())
					}))
	    }
	}

	get_weather() {
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
}

module.exports = WeatherAgent;
