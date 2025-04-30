const Agent = require("./Agent.js")

class LoggingAgent extends Agent {
    constructor(props, id) {
	super("LoggingAgent", id, Date.now(), null)
	this.log = []
	}

	async run() {
	    if (!this.isRunning) return
	    while (this.log.length > 0){
		let log = this.log.pop()
		console.log(log)
	    }
	}

    async receive(data){
	    if (!this.isRunning) return
	this.log.push(await data)
	this.run()
    }
    

}

module.exports = LoggingAgent;
