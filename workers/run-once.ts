import { runCrtshCollection } from "../lib/collectors/run-collection";

runCrtshCollection()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
