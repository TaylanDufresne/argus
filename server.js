const port = process.env.PORT || 3010;
const fs = require("fs")
const sqlite3 = require('sqlite3').verbose();


const express = require('express')
const app = express()

const db = new sqlite3.Database('argus.db', (err) => {
    if (err) {
	console.error(err.message);
    }
    console.log('Connected to the database.');
});

var eyes = 0

db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) {
	console.error(err.message);
    }
    eyes = rows.length
    rows.forEach((row) => {
	row.data = JSON.parse(row.data)
	console.log(row);
	determine_task(row)
    });
});


function determine_task(item){
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
}

function print_id(item){
    console.log(item.id)
}

function perform_periodically(item, func){
    const currentTime = Date.now()
    const repeat = item.repeat
    let startTime

    if (item.start < currentTime){
	// If we're already passed the start time, calculate the next
	// incrementing time
	startTime = (currentTime - item.start) % repeat 
    }
    else{
	// Otherwise, calculate the wait to the start time
	startTime = item.start - currentTime
    }
    console.log(startTime)

    // Use a timeout so we start the interval at the correct time
    // Then the interval manages itself
	setTimeout(item => {
	    func(item)
	    setInterval(x => {
		func(x)
	    }, item.repeat, item)
	},startTime, item)
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
setTimeout(() => {

console.log(`Argus opening ${eyes} eyes on port: ${port}`)
},200)
