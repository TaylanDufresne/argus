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
      
    }
]


sample_tasks.forEach(item => {
    switch (item.data.task){
    case "test_interval":
	setTimeout(item => {
	    console.log(item)  
	    setInterval(x => {
		console.log(x.id + " repeated")
	    }, item.data.repeat, item)
	},item.data.start, item)
	break
    case "make_hash":
	fetch(item.data.url)
	    .then(page => {
		const encoder = new TextEncoder();
		const data = encoder.encode(page);
		crypto.subtle.digest('SHA-256', data)
		    .then(buffer => {
			const hashArray = Array.from(new Uint8Array(buffer));
			const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
			console.log("Found test")
			console.log(hashed)
		    })
	    })
	
	break
    default:
    }
})

app.listen(port)
console.log(`Argus opening ${sample_tasks.length} eyes on port: ${port}`)
