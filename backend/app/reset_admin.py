import os

import bcrypt
import psycopg


def main() -> None:
    database_url = os.environ["DATABASE_URL"]
    email = os.getenv("ADMIN_EMAIL", "admin@gestao.local").strip().lower()
    password = os.environ["ADMIN_PASSWORD"]
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    with psycopg.connect(database_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id
                  FROM users
                 WHERE LOWER(username) = 'admin'
                    OR LOWER(email) = %s
                 ORDER BY CASE WHEN LOWER(username) = 'admin' THEN 0 ELSE 1 END
                 LIMIT 1
                """,
                (email,),
            )
            row = cursor.fetchone()
            if row:
                cursor.execute(
                    """
                    UPDATE users
                       SET username = 'admin', email = %s, password_hash = %s,
                           role = 'Administrador', active = TRUE, updated_at = NOW()
                     WHERE id = %s
                    """,
                    (email, password_hash, row[0]),
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO users (name, username, email, password_hash, role, active)
                    VALUES ('Administrador', 'admin', %s, %s, 'Administrador', TRUE)
                    """,
                    (email, password_hash),
                )

    print("Usuário administrador sincronizado.")


if __name__ == "__main__":
    main()
