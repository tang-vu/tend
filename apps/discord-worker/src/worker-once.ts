import {
  DemoFollowUpProcessor,
  FailClosedFollowUpProcessor,
  openDatabase,
  runDueFollowUp,
  SqliteTendRepository,
} from "@tend/db";

const database = openDatabase();
const processor =
  process.env.TEND_MODE === "live"
    ? new FailClosedFollowUpProcessor()
    : new DemoFollowUpProcessor();
const result = await runDueFollowUp(new SqliteTendRepository(database), {
  processor,
});
database.close();
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
