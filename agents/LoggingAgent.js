const Agent = require("./Agent.js")

class LoggingAgent extends Agent {
    constructor(props, id) {
	super("LoggingAgent", id, Date.now(), null)
	this.data = []
	}

	async run() {
	    if (!this.isRunning) return
	    while (this.data.length > 0){
		let log = this.data.pop()
		console.log(log)
	    }
	}

    async receive(data){
	    if (!this.isRunning) return
	this.data.push(await data)
	this.run()
    }
    

}

module.exports = LoggingAgent;
