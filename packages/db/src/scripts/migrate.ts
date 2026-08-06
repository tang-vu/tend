import { openDatabase } from "../database";

const database = openDatabase();
database.close();
process.stdout.write("TEND database migrations are current.\n");
