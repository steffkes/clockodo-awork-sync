import { readdirSync, readFileSync } from "node:fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

import { match } from "./users";

const __dirname = dirname(fileURLToPath(import.meta.url));
const readFixture = (path) => JSON.parse(readFileSync(path));

test("01", () => {
  expect(
    match({
      clockodo: readFixture(
        __dirname + "/../fixtures/test_clockodo-api-users.json",
      ),
      awork: readFixture(__dirname + "/../fixtures/test_awork-api-users.json"),
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

test("02", () => {
  expect(
    match({
      clockodo: readFixture(
        __dirname + "/../fixtures/prod_clockodo-api-users.json",
      ),
      awork: readFixture(__dirname + "/../fixtures/prod_awork-api-users.json"),
    }),
  ).toStrictEqual({
    matched: [
      {
        awork_user_id: "96d3677c-8906-4881-aeae-1be05549fd1a",
        clockodo_user_id: 123451,
        email: "doe14@example.org",
      },
      {
        awork_user_id: "f68cf2a8-18f4-4c26-b9e5-fc375cbd39e9",
        clockodo_user_id: 123452,
        email: "doe5@example.org",
      },
      {
        awork_user_id: "7ea9be7d-b6e2-4a93-a668-7303fc69f3f2",
        clockodo_user_id: 123453,
        email: "doe4@example.org",
      },
      {
        awork_user_id: "1aa1c060-f16b-46b7-ade4-72f0689d66c2",
        clockodo_user_id: 123454,
        email: "doe13@example.org",
      },
      {
        awork_user_id: "5a8ba95a-0732-4284-8061-c3d4e6561400",
        clockodo_user_id: 123456,
        email: "doe12@example.org",
      },
      {
        awork_user_id: "118bad03-0063-4cf6-89cc-d1e2fe5b920f",
        clockodo_user_id: 123457,
        email: "doe6@example.org",
      },
    ],
    awork_to_clockodo: {
      "118bad03-0063-4cf6-89cc-d1e2fe5b920f": 123457,
      "1aa1c060-f16b-46b7-ade4-72f0689d66c2": 123454,
      "5a8ba95a-0732-4284-8061-c3d4e6561400": 123456,
      "7ea9be7d-b6e2-4a93-a668-7303fc69f3f2": 123453,
      "96d3677c-8906-4881-aeae-1be05549fd1a": 123451,
      "f68cf2a8-18f4-4c26-b9e5-fc375cbd39e9": 123452,
    },
    clockodo_to_awork: {
      123451: "96d3677c-8906-4881-aeae-1be05549fd1a",
      123452: "f68cf2a8-18f4-4c26-b9e5-fc375cbd39e9",
      123453: "7ea9be7d-b6e2-4a93-a668-7303fc69f3f2",
      123454: "1aa1c060-f16b-46b7-ade4-72f0689d66c2",
      123456: "5a8ba95a-0732-4284-8061-c3d4e6561400",
      123457: "118bad03-0063-4cf6-89cc-d1e2fe5b920f",
    },
  });
});
