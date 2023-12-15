import { readdirSync, readFileSync } from "node:fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

import { match } from "./users";

const __dirname = dirname(fileURLToPath(import.meta.url));
const readFixture = (path) => JSON.parse(readFileSync(path));

test("01", () => {
  expect(
    match({
      clockodo: readFixture(__dirname + "/../fixtures/clockodo-api-users.json"),
      awork: readFixture(__dirname + "/../fixtures/awork-api-users.json"),
    }),
  ).toStrictEqual({
    matched: [
      {
        email: "clockodo@mail.gelungen.es",
        clockodo_user_id: 320767,
        awork_user_id: "cf8c614f-a9c0-4755-8a8f-9978b27e5417",
      },
      {
        email: "clockodo2@mail.gelungen.es",
        clockodo_user_id: 320768,
        awork_user_id: "02c106da-63ce-4138-a60b-e730232ca57d",
      },
    ],
    awork_to_clockodo: {
      "cf8c614f-a9c0-4755-8a8f-9978b27e5417": 320767,
      "02c106da-63ce-4138-a60b-e730232ca57d": 320768,
    },
    clockodo_to_awork: {
      320767: "cf8c614f-a9c0-4755-8a8f-9978b27e5417",
      320768: "02c106da-63ce-4138-a60b-e730232ca57d",
    },
  });
});
