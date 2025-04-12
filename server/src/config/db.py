import sqlite3

def setup_database():
    conn = sqlite3.connect('database.db')  # Connect to the SQLite database
    cursor = conn.cursor()

    # Create 'users' table if it doesn't already exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT UNIQUE
        )
    ''')

    # Create 'interactions' table as defined
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            input_text TEXT,
            response_text TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT interactions_users_id_fk
                REFERENCES users (user_id)
        )
    ''')

    conn.commit()  # Commit the changes to the database
    cursor.close()  # Close the cursor
    conn.close()  # Close the connection to the database

setup_database()
