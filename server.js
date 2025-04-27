const port = process.env.PORT || 3010;
const fs = require("fs")
const sqlite3 = require('sqlite3').verbose();
const ejs = require('ejs')


const express = require('express')
const app = express()

const WeatherAgent = require("./agents/WeatherAgent.js")
const LoggingAgent = require("./agents/LoggingAgent.js")
const SqlInsertionAgent = require("./agents/SqlInsertionAgent.js")


// For each agent, check if in the map
// If they have a listed downstream agent,
// check the map for it, if it's not there,
// make it and put it in the map
agent_map = {}


app.set('view engine', 'ejs');

const db = new sqlite3.Database('argus.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the database.');
});

var eyes = 0

db.all("select * from tasks", [], (err, rows) => {
	if (err) {
		console.error(err.message);
	}
	eyes = rows.length
	deploy_agents(rows, db)
});

db.close()


function deploy_single_agent(row) {
	let opening_eye
	if (agent_map[row.id]) {
		console.log("exists")
		opening_eye = agent_map[row.id]
	}
	else {
		opening_eye = determine_agent(row)
		agent_map[row.id] = opening_eye
	}
	opening_eye.start()
	return opening_eye

}

function deploy_agents(rows, db) {
	rows.forEach(row => {
		row.data = JSON.parse(row.data)
		const opening_eye = deploy_single_agent(row)
		const downstream_agent = row.data.downstream_agent
		if (downstream_agent) {
			if (agent_map[downstream_agent]) {
				opening_eye.set_downstream_agent(agent_map[downstream_agent])
			}
			else {
				// I don't have the row, this will need to be a separate request
				db.get(`SELECT * FROM tasks WHERE id = ${downstream_agent}`, [], (err, row) => {
					if (err) {
						console.error(err.message);
					}
					row.data = JSON.parse(row.data)
					let downstream_agent = deploy_single_agent(row)
					opening_eye.set_downstream_agent(downstream_agent)
				});
			}
		}
	})
}

function determine_agent(item) {
	const id = item.id
	const data = item.data
	const begin = item.begin
	const repeat = item.repeat
	switch (item.data.task) {
		case "logger":
			return new LoggingAgent(data, id, begin, repeat)
		case "sql_inserter":
			return new SqlInsertionAgent(data, id, begin, repeat)
		case "weather":
			return new WeatherAgent(data, id, begin, repeat)
		default:
	}

}
function determine_task(item) {
	switch (item.data.task) {
		case "test_interval":
			console.log(perform_periodically(item, print_id))
			break
		case "make_hash":
			make_hash(item.data.url)
				.then(x => console.log(x))
			break
		case "weather":
			get_weather(item.data.url)
				.then(weather => {
					console.log(parse_weather(weather, calculate_day(0)))
				})
			break
		default:
	}
}


function make_hash(url) {
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



app.get("/dashboard", (req, res) => {
	console.log("visitor")
	db.all("SELECT * FROM tasks", (err, rows) => {

		// Make this more readable for the template
		rows.map(row => {
			row.data = JSON.parse(row.data)
			row.start = human_readable_start(row.start)
			row.repeat = human_readable_repeat(row.repeat)
			return row
		})

		res.render("dashboard", { tasks: rows });
	})
})

app.listen(port)

// Cheeky timeout to make sure the number of eyes is correct
setTimeout(() => {
	console.log(`Argus opening ${eyes} eyes on port: ${port}`)
}, 200)
