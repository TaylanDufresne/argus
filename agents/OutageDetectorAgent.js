const Agent = require("./Agent.js")


class OutageDetectorAgent extends Agent {

    constructor(props, id, begin, repeat) {
	super(`OutageDetectorAgent`, id, begin, repeat)
	this.downstreamAgent = props.downstreamAgent
	this.isOutage = false;
    }

    start() {
	if (this.isRunning) {
	    console.log(`Agent [${this.name}: ${this.id}] is already running.`)
	    return
	}

	this.isRunning = true;
	console.log(`Agent [${this.name}: ${this.id}] - starting...`)

	this.run()
    }
    
    stop() {

	if (!this.isRunning) {
	    console.log(`Agent [${this.name}: ${this.id}] is not running.`)
	    return; 
	}

	clearTimeout(this.repeatId)
	this.isRunning = false;
	console.log(`Agent [${this.name}: ${this.id}] is stopped.`)
    }

    async run() {
	if (!this.downstreamAgent){
	    return 
	}
	else{
	    if (this.isOutage) {
		console.log("Resolved!")
		send_downstream(`${this.name}: outage resolved.`)
		this.isOutage = false
	    }
	    const id = setTimeout(()=>{
		console.log("Outage!")
		this.isOutage = true
		send_downstream(`${this.name}: detected an outage.`)
	    }, this.repeat)
	    return id;
	}
    }

    async receive(data){
	if (!this.isRunning) return
	reset_timer()
    }

    reset_timer(){
	clearTimeout(this.repeatId)
	this.repeatId = this.run()
    }


}

module.exports = WeatherAgent;
