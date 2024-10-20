const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres', //This _should_ be your username, as it's the default one Postgres uses
  host: 'localhost',
  database: 'postgres', //This should be changed to reflect your actual database
  password: 'Hockey2550!', //This should be changed to reflect the password you used when setting up Postgres
  port: 5432,
});

/**
 * Creates the database tables, if they do not already exist.
 */
async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movies (
        movie_id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        release_year INT NOT NULL,
        genre VARCHAR(50) NOT NULL,
        director VARCHAR(255) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(15) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rentals (
        rental_id SERIAL PRIMARY KEY,
        movie_id INT REFERENCES movies(movie_id),
        customer_id INT REFERENCES customers(customer_id),
        rental_date DATE NOT NULL,
        return_date DATE
      )
    `);

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
}


/**
 * Inserts a new movie into the Movies table.
 * 
 * @param {string} title Title of the movie
 * @param {number} year Year the movie was released
 * @param {string} genre Genre of the movie
 * @param {string} director Director of the movie
 */
async function insertMovie(title, year, genre, director) {
  try {
    await pool.query(
      'INSERT INTO movies (title, release_year, genre, director) VALUES ($1, $2, $3, $4)',
      [title, year, genre, director]
    );
    console.log(`Movie '${title}' inserted successfully.`);
  } catch (err) {
    console.error('Error inserting movie:', err);
  }
}


/**
 * Prints all movies in the database to the console
 */
async function displayMovies() {
  try {
    const response = await pool.query('SELECT * FROM movies');

    response.rows.forEach((row) => {
      console.log(`${row.title} (${row.year}) - ${row.genre}, Directed by ${row.director}`);
    });
  } catch (err) {
    console.error('Error displaying movies:', err);
  }
}

/**
 * Updates a customer's email address.
 * 
 * @param {number} customerId ID of the customer
 * @param {string} newEmail New email address of the customer
 */
async function updateCustomerEmail(customerId, newEmail) {
  try {
    const result = await pool.query(
      'UPDATE customers SET email = $1 WHERE customer_id = $2',
      [newEmail, customerId]
    );

    if (result.rowCount > 0) {
      console.log(`Customer ID ${customerId} email updated to ${newEmail}.`);
    } else {
      console.log(`Customer ID ${customerId} not found.`);
    }
  } catch (err) {
    console.error('Error updating customer email:', err);
  }
}


/**
 * Removes a customer from the database along with their rental history.
 * 
 * @param {number} customerId ID of the customer to remove
 */
async function removeCustomer(customerId) {
  try {
    await pool.query('DELETE FROM rentals WHERE customer_id = $1', [customerId]);
    const result = await pool.query('DELETE FROM customers WHERE customer_id = $1', [customerId]);

    if (result.rowCount > 0) {
      console.log(`Customer ID ${customerId} removed along with rental history.`);
    } else {
      console.log(`Customer ID ${customerId} not found.`);
    }
  } catch (err) {
    console.error('Error removing customer:', err);
  }
}


/**
 * Prints a help message to the console
 */
function printHelp() {
  console.log('Usage:');
  console.log('  insert <title> <year> <genre> <director> - Insert a movie');
  console.log('  show - Show all movies');
  console.log('  update <customer_id> <new_email> - Update a customer\'s email');
  console.log('  remove <customer_id> - Remove a customer from the database');
}

/**
 * Runs our CLI app to manage the movie rentals database
 */
async function runCLI() {
  await createTable();

  const args = process.argv.slice(2);
  switch (args[0]) {
    case 'insert':
      if (args.length !== 5) {
        printHelp();
        return;
      }
      await insertMovie(args[1], parseInt(args[2]), args[3], args[4]);
      break;
    case 'show':
      await displayMovies();
      break;
    case 'update':
      if (args.length !== 3) {
        printHelp();
        return;
      }
      await updateCustomerEmail(parseInt(args[1]), args[2]);
      break;
    case 'remove':
      if (args.length !== 2) {
        printHelp();
        return;
      }
      await removeCustomer(parseInt(args[1]));
      break;
    default:
      printHelp();
      break;
  }
};

runCLI();
