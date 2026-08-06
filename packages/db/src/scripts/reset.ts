import { openDatabase } from "../database";
import { SqliteTendRepository } from "../store";

const database = openDatabase();
const repository = new SqliteTendRepository(database);
const snapshot = repository.resetDemo();
database.close();
process.stdout.write(
  `Demo reset: ${snapshot.community.name} · phase ${snapshot.demoPhase}\n`,
);
