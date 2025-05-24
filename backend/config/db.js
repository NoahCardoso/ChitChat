import pg from "pg";
import env from "dotenv";
env.config({path: "./../.env"});

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_USERHOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

export default db;