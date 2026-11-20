if __name__ == "__main__":
    from sqlalchemy import text

    from db import engine

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        print(f"Connected to {connection.dialect.name}.")
