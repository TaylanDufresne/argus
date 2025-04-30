const port = process.env.PORT || 3010;
const fs = require("fs")
const sqlite3 = require('sqlite3').verbose();
const ejs = require('ejs')


const express = require('express')
const app = express()

const WeatherAgent = require("./agents/WeatherAgent.js")
const LoggingAgent = require("./agents/LoggingAgent.js")
const SqlInsertionAgent = require("./agents/SqlInsertionAgent.js");

const agent_configs = {
    WeatherAgent: {
	fields: [
	{ name: 'start', type: 'datetime-local' },
	{ name: 'interval', type: 'number' },
	{ name: 'location', type: 'text' },
	{ name: 'offset', type: 'number'}
    ]},
    LoggingAgent: {
	fields: [
    ]},
    SqlInsertionAgent: {
	fields: [
	{ name: 'start', type: 'datetime-local' },
	{ name: 'interval', type: 'number' },
	{ name: 'tb_name', type: 'text'}, // Probably config this? Or agents can pass it downstream - can be ignored by anything that wouldn't use it
	{ name: 'isTimeSeries', type: 'checkbox'}
    ]}
}


const e = require("express");


// For each agent, check if in the map
// If they have a listed downstream agent,
// check the map for it, if it's not there,
// make it and put it in the map
agent_map = {}

app.use(express.urlencoded({ extended: true })); // for forms
app.use(express.json());
app.use(express.static("public"))
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


function connect_db(){
    const db = new sqlite3.Database('argus.db', (err) => {
	if (err) {
	    console.error(err.message);
	}
	console.log('Connected to the database.');
    });
    return db

}


function deploy_single_agent(row) {
	let opening_eye
	if (agent_map[row.id]) {
		console.log("exists")
		opening_eye = agent_map[row.id]
	}
	else {
	    
		opening_eye = determine_agent(row)
		opening_eye.set_parent(row.data.parent_id)
		agent_map[row.id] = opening_eye

	}
	opening_eye.start()
	return opening_eye

}

// TODO 
// Given that I've now decided to track both parent and child id's, this can be done
// better and recursively.
function deploy_agents(rows, db) {
	rows.forEach(row => {
		row.data = JSON.parse(row.data)
		const opening_eye = deploy_single_agent(row)
		const downstream_agent_id = row.data.downstream_agent
		if (downstream_agent_id) {
			if (agent_map[downstream_agent_id]) {
			    const downstream_agent = agen_map[downstream_agent_id]
			    opening_eye.set_downstream_agent(agent_map[downstream_agent_id])
			    downstream_agent.set_parent(opening_eye.id) 
			}
			else {
				// I don't have the row, this will need to be a separate request
				db.get(`SELECT * FROM tasks WHERE id = ${downstream_agent_id}`, [], (err, row) => {
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


function human_readable_start(time) {
 	const date = new Date(time)
 	const hours = date.getHours();
 	const minutes = date.getMinutes();
 	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
 
 }
 
 function human_readable_repeat(time) {
 	const seconds = Math.floor(time / 1000) % 60
 	const minutes = Math.floor(time / (60 * 1000)) % 60
 	const hours = Math.floor(time / (60 * 60 * 1000)) % 24
 	const days = Math.floor(time / (24 * 60 * 60 * 1000))
 
 	const test = new Date(time)
 	console.log(test)
 	console.log(`Days: ${days}, Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}`)
 	return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
 
 }

app.post('/agents/reorder', (req, res) => {
  console.log(req.body)
  const { id, newIndex, newParentId } = req.body;
  const agent = agent_map[id]
    console.log(agent)
  if (!agent) return res.status(404).send('Agent not found');

  const old_parent = agent_map[agent.parent_id]
  agent.set_parent(newParentId);
  const updated_parent = agent_map[newParentId]

    if (old_parent){
	old_parent.set_downstream_agent(null)
    }
    if(updated_parent){
  updated_parent.set_downstream_agent(agent)
    }

    const updatedAgents = Object.keys(agent_map).map(id => {
	console.log(agent_map[id])
	return {"id": id, hasChildren: agent_map[id].downstream_agent ? true : false}
    })

    console.log(updatedAgents)
    
res.json({
  success: true,
    updatedAgents
  })

});


app.get("/dashboard", (req, res) => {
	console.log("visitor")
    const db = connect_db()
	db.all("SELECT * FROM tasks", (err, rows) => {

	    console.log(rows)
		// Make this more readable for the template
	    rows.map(row => {
		const agent = agent_map[row.id]
		row.data = JSON.parse(row.data)
		// row.start = human_readable_start(row.start)
		row.repeat = human_readable_repeat(row.repeat)
		row.isRunning = agent_map[row.id].isRunning
		row.name = agent.name
		console.log(agent)
		console.log(agent.parent_id)
		row.parent_id = agent.parent_id
		return row
	    })

	    console.log(rows)
		res.render("dashboard", { agents: rows });
	})
    db.close()
})

// Get single agent by ID
app.get('/agents/:id', (req, res) => {
    console.log(req.params)
    const agent = agent_map[+req.params.id]
  if (!agent) return res.status(404).send('Not found');
  res.json(agent);
});

// Get agent configuration object
app.get('/agent/config', (req, res) => {
    console.log(req.params)
  if (!agent_configs) return res.status(404).send('Not found');
  res.json(agent_configs);
});

// Edit agent
app.post('/agents/edit', (req, res) => {
  const { agentId, name, startTime, interval } = req.body;
  const agent = agents.find(a => a.id === agentId);
  if (agent) {
    agent.name = name;
    agent.startTime = new Date(startTime).toISOString();
    agent.interval = parseInt(interval);
  }
  res.send(200);
});

// Toggle Agent on and off
app.post('/agents/toggle/:id', (req, res) => {
    console.log(req.params)
    const agent = agent_map[+req.params.id]
  if (!agent) return res.status(404).send('Not found');
    agent.toggle()
    res.json({
	id: agent.id,
	isRunning : agent.isRunning
    });
});

app.listen(port)

// Cheeky timeout to make sure the number of eyes is correct
setTimeout(() => {
	console.log(`Argus opening ${eyes} eyes on port: ${port}`)
}, 200)
