const Agent = require("./Agent.js")
const sqlite3 = require('sqlite3').verbose();


class SqlInsertionAgent extends Agent {

	constructor(db_name, table_name, isTimeSeries, id, begin, repeat, downstream_agent = null) {
		super(`${id}-SqlInsertionAgent`, id, begin, repeat, downstream_agent)
		this.db_name = db_name
		this.table_name = table_name
		this.isTimeSeries = isTimeSeries
		this.data_to_insert = []
	}

	async run() {

		while (this.data_to_insert.length > 0) {
			const data = this.data_to_insert.pop()
			const db = new sqlite3.Database(this.db_name, (err) => {
				if (err) {
					console.error(err.message);
				}
			});
		    let sql_statement, query_string, variable_list
			if (this.isTimeSeries) {
				// Make a new entry
				[query_string, variable_list] = this.get_insert_query(data)
				sql_statement = `INSERT INTO ${this.table_name} ${query_string}`
			}
			else {
				// Overwrite entry
				[query_string, variable_list] = this.get_update_query(data)
				sql_statement = `UPDATE ${this.table_name} SET ${query_string} WHERE id = ${this.id}`
			}
			// Check if table exists first
			db.get(`SELECT * FROM ${this.table_name} WHERE parent = ?`, data.parent, (err, row) => {
				if (err) {
					console.error(err.message)
				}
				if (row) {
					db.run(sql_statement, variable_list, (err) => {
						if (err) {
							return console.error(err.message);
						}
					})
				}
				else {
					db.run(this.create_table(data), err => {
						if (err) {
							return console.error(err.message);
						}
						console.log(`Table: ${this.table_name} created.`)
						let [query_string, variable_list] = this.get_insert_query(data)
						let sql_statement = `INSERT INTO ${this.table_name} ${query_string}`
						db.run(sql_statement, variable_list, (err) => {
							if (err) {
								return console.error(err.message);
							}
						})
					})
				}
			})

			db.close()
		}
		if (!this.downstream_agent) {
			return
		}
		else {
			// Send a success if there is a downstream agent?
			// This could be used as a trigger after an update.
			this.send_downstream(data)
		}
	}

	async receive(data) {
		this.data_to_insert.push(data)
		this.run()
	}

	get_insert_query(data) {
		let column_string = `(`
		let value_string = `VALUES (`
		let parameter_list = []
		Array.from(Object.keys(data)).forEach(key => {
			column_string += `${key}, `
			value_string += `?, `
			parameter_list.push(data[key])
		})
		column_string = column_string.substring(0, column_string.length - 2)
		value_string = value_string.substring(0, value_string.length - 2)

		column_string += `) `
		value_string += `)`
		const query_string = column_string + value_string
		return [query_string, parameter_list]
	}

	get_update_query(data) {
		const query_string = Object.keys(data).map(key => `${key} = ?`).join(', ');
		const parameter_list = Object.keys(data).map(key => data[key])
		return [query_string, parameter_list]
	}

	create_table(data) {

		// map over values in data, use switch statment to apply proper datatype
		const columns = Object.keys(data).map(key => `${key} ${this.determine_sql_datatype(data[key])}`).join(', ')

		const create_table_sql = `CREATE TABLE IF NOT EXISTS ${this.table_name} (id INTEGER PRIMARY KEY AUTOINCREMENT, ${columns})`;
	    return create_table_sql
	}

	determine_sql_datatype(query) {
		switch (typeof query) {
			case 'number':
				return "INTEGER"
			case 'string':
				if (!isNaN(query)) {
					if (query.toString().includes('.')) return "FLOAT"
					return "INTEGER"
				}
				return "TEXT"
		}
	}


}

module.exports = SqlInsertionAgent;
