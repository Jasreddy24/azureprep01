require('dotenv').config();
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, '..', 'ecommerce.db');
const db = new sqlite3.Database(dbPath);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');

    if (!name || !email || !password) {
      console.log('All fields are required!');
      rl.close();
      db.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (email, password, name, is_admin) VALUES (?, ?, ?, 1)',
      [email, hashedPassword, name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            console.log('Email already exists!');
          } else {
            console.error('Error creating admin:', err);
          }
        } else {
          console.log(`Admin user created successfully with ID: ${this.lastID}`);
        }
        rl.close();
        db.close();
      }
    );
  } catch (error) {
    console.error('Error:', error);
    rl.close();
    db.close();
  }
}

console.log('Creating admin user...');
createAdmin();
