
class Agent {
    constructor(name, id, begin = Date.now(), repeat = 3600000){
	this.name = `${name}-${id}`;
	this.id = id;
	this.parentId = null;
	this.repeat = repeat
	this.begin = begin
	this.repeatId = null;
	this.isRunning = false;
	this.downstream_agent = null;
    }

    set_downstream_agent(agent){
	this.downstream_agent = agent;
	return;
    }
    start() {
	if (this.isRunning) {
	    console.log(`Agent [${this.id}: ${this.name}] is already running.`)
	    return
	}

	this.isRunning = true;
	    console.log(`Agent [${this.id}: ${this.name}] - starting...`)

	if(this.repeat != null){
	    this.perform_periodically()
	}
	else if (this.start != null) {
	    this.run()
	}
    }
	
    stop() {

	if (!this.isRunning) {
	    console.log(`Agent [${this.id}: ${this.name}] is not running.`)
	    return; 
	}

	clearInterval(this.repeatId)
	this.isRunning = false;
	console.log(`Agent [${this.id}: ${this.name}] is stopped.`)
    }

    perform_periodically() {
	const currentTime = Date.now()
	let startTime = currentTime

	if (this.begin < currentTime) {
	    // If we're already passed the start time, calculate the next
	    // incrementing time
	    startTime = (currentTime - this.begin) % this.repeat
	}
	else {
	    // Otherwise, calculate the wait to the start time
	    startTime = this.begin - currentTime
	}
	// Use a timeout so we start the interval at the correct time
	// Then the interval manages itself
	setTimeout(() => {
	    this.run()
	    this.repeatId = setInterval(x => {
		this.run()
	    }, this.repeat)
	}, startTime)
    }


    // Methods to overrided
    describe(){

	return `This is boilerplate text from the Agent class. This should be
                overridden with a description of the Agent that extends this class`
    }

    async run() {
	console.warn(`Agent [${this.id}: ${this.name}] run() method not implemented.`);
    }

    async receive(data){
	// Agents that can be piped into (such as a LoggingAgent) overwrite this
	// method to transform data. Agents that cannot be piped into (such as
	// a WeatherAgent), can use this method as a trigger. This can result in
	// them firing both on a timer, and when triggered by another agent.
	this.run()
    }

    // Wrapper method to make sending/receiving more intuitive
    async send_downstream(data){
	data = await data
	data["parent"] = `${this.name}`
	data["parent_id"] = `${this.id}`
	if(!this.downstream_agent){
	    console.warn(`Agent [${this.id}: ${this.name}] does not have a downstream agent.`);
	    return
	}
	this.downstream_agent.receive(data)
	
    }

    set_parent(id){
	this.parent_id = id;
    }

    toggle(){
	if (this.isRunning){
	    this.stop()
	}
	else{
	    this.start()
	}
    }


}

module.exports = Agent;
