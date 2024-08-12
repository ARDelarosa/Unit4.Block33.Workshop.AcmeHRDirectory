const express = require('express')
const app = express()
const pg = require('pg')
const client = new pg.Client(
    process.env.DATABASE_URL || 'postgres://postgres:Viper001@localhost:5432/acme_hr_directory_db'
)
const port = process.env.PORT || 3000

app.use(express.json());
app.use(require('morgan')('dev'));

// app routes & CRUD
// get to departments
app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * from departments;
        `
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (error) {
        next(error)
    }
})
// get to employees
app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * from employees ORDER BY created_at DESC;
        `
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (error) {
        next(error)
    }
})
// post to employees
app.post('/api/employees', async (req, res, next) => {
    try {
        const body = req.body
        const name = body.name
        const cat_id = body.category_id
        const SQL = `
        INSERT INTO employees(name, category_id)
        VALUES($1, $2)
        RETURNING *;
        `
        const response = await client.query(SQL, [name, cat_id])
        res.send(response.rows[0])
    } catch (error) {
        next(error)
    }
})
// update to employees
app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const id = req.params.id
        const body = req.body
        const name = body.name
        const cat_id = body.category_id
        const SQL = `
        UPDATE employees
        SET name=$1, category_id=$2, updated_at= now()
        WHERE id=$3
        RETURNING *;
        `
        const response = await client.query(SQL, [name, cat_id, id])
        res.send(response.rows[0])
    } catch (error) {
        next(error)
    }
})
// delete from employees
app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const id = req.params.id
        const SQL = `
        DELETE FROM employees
        WHERE id = $1;
        `
        await client.query(SQL, [id])
        res.sendStatus(204);
    } catch (error) {
        next(error)
    }
})

// create init function and the tables
const init = async() => {
    await client.connect();
    console.log('connected to the database')
    let SQL = `
    DROP TABLE IF EXISTS departments CASCADE;
    DROP TABLE IF EXISTS employees CASCADE;
    CREATE TABLE departments(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
    );
    CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    category_id INTEGER REFERENCES categories(id) NOT NULL
    );`
    await client.query(SQL);
    console.log('tables created');

    SQL=`
    INSERT INTO departments(name) VALUES('Accounting');
    INSERT INTO departments(name) VALUES('Production');
    INSERT INTO departments(name) VALUES('Management');
    INSERT INTO employees(name, category_id) VALUES('John Smith', (SELECT id FROM departments WHERE name='Accounting'));
    INSERT INTO employees(name, category_id) VALUES('Hannah Wilson', (SELECT id FROM departments WHERE name='Production'));
    INSERT INTO employees(name, category_id) VALUES('Kevin Brooks', (SELECT id FROM departments WHERE name='Management'));
    `
    await client.query(SQL);
    console.log('data seeded');
    app.listen(port, () => console.log(`listening on port ${port}`));
}

init()
