from db import engine

try:
    with engine.connect() as connection:
        print("Successfully connected to Supabase PostgreSQL!")
        print("Database:", connection.dialect.name)
except Exception as e:
    print("Database connection failed:")
    print(e)