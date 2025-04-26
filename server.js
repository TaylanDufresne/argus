const port = process.env.PORT || 3010;
const fs = require("fs")


const express = require('express')
const app = express()

const sample_tasks = [
    { id: 0,
      data: {task: "test_interval",
	     url: "google.ca",
	     start: 2000,
	     repeat:5000
	    }
      
    },
    { id: 1,
      data: {task: "test_interval",
	     url: "github.com",
	     start: 1000,
	     repeat:3000
	    }
      
    },
    { id: 2,
      data: {task: "make_hash",
	     url: "https://google.ca",
	     start: 1000,
	     repeat:3000
	    }
      
    },
    { id: 3,
      data: {task: "gibberish",
	     url: "github.com",
	     start: 1000,
	     repeat:3000
	    }
      
    },
    
    { id: 4,
      data: {task: "weather",
	     location: "Saskatoon",
	     start: 9000,
	     repeat:10000
	    }
      
    }
]


sample_tasks.forEach(item => {
    switch (item.data.task){
    case "test_interval":
	perform_periodically(item, print_id)
	break
    case "make_hash":
	make_hash(item.data.url)
	    .then(x => console.log(x))
	break
    case "weather":
	get_weather(item.data.url)
	    .then(weather => {
		console.log(parse_weather(weather,calculate_day(0)))})
	break
    default:
    }
})

function print_id(item){
    console.log(item.id)
}

function perform_periodically(item, func){
	setTimeout(item => {
	    console.log(item)  
	    setInterval(x => {
		func(x)
	    }, item.data.repeat, item)
	},item.data.start, item)
}

function make_hash(url){
	return fetch(url)
	    .then(page => {
		const encoder = new TextEncoder();
		const data = encoder.encode(page);
		const hashed_page = crypto.subtle.digest('SHA-256', data)
		    .then(buffer => {
			const hashArray = Array.from(new Uint8Array(buffer));
			const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
			console.log("Found test")
			console.log(hashed)
			return hashed
		    })
		return hashed_page
	    })
}

function calculate_day(offset){

    const date = new Date()
    date.setDate(date.getDate() + offset)

    const day = date.getDate() 
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const formattedDate = `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`
    
    return formattedDate
    
}

function get_weather(item){
    return fetch("https://wttr.in/Saskatoon?format=j1")
	.then(response => response.json())
	.then(data => data.weather)
}

function parse_weather(weather, day){
    for (let data of weather){
	if (data.date === day){

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


app.listen(port)
console.log(`Argus opening ${sample_tasks.length} eyes on port: ${port}`)
