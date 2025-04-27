const Agent = require("./Agent.js")

class LoggingAgent extends Agent {
    constructor(id) {
	super("LoggingAgent", id, Date.now(), null)
	this.data = []
	}

	async run() {
	    while (this.data.length > 0){
		let log = this.data.pop()
		console.log(log)
	    }
	}

    async downstream(data){
	this.data.push(await data)
	this.run()
    }
    

}

module.exports = LoggingAgent;
