import axios from "axios";

import { match } from "./src/users.mjs";

const clockodo = axios.create({
  baseURL: "https://my.clockodo.com/api",
  auth: {
    username: process.env.CLOCKODO_API_USER,
    password: process.env.CLOCKODO_API_KEY,
  },
});

const awork = axios.create({
  baseURL: "https://api.awork.com/api/v1",
  headers: { Authorization: "Bearer " + process.env.AWORK_API_KEY },
});

const { data: clockodo_users } = await clockodo.get("/users");
const { data: awork_users } = await awork.get("/users");

const users = match({
  clockodo: clockodo_users,
  awork: awork_users,
});
console.dir({ users }, { depth: null });

// -- absences

const categoryMap = {
  1: "🏖️ Urlaub",
  3: "🏖️ Urlaub",

  4: "🤒 Krank",
  15: "🤒 Krank",
  11: "🤒 Krank",
  5: "🤒 Krank",
  12: "🤒 Krank",
};

const { data: clockodo_data_absences } = await clockodo.get("/absences", {
  params: { year: 2023 },
});
const clockodo_absences = clockodo_data_absences.absences
  .filter(({ users_id: userId }) => userId in users.clockodo_to_awork)
  .filter(({ type }) => type in categoryMap)
  .filter(({ status }) => status == 1); // status=1 is approved
console.dir({ clockodo_absences }, { depth: null });

const { data: awork_data_absences } = await awork.get("/absences", {
  params: {
    filterby: "startswith(externalProvider,'clockodo-absences')",
  },
});
console.dir({ awork_data_absences }, { depth: null });

await Promise.allSettled(
  awork_data_absences.map(
    (absence) =>
      new Promise(async (resolve, reject) => {
        try {
          await awork.delete("/absences/" + absence.id);
          resolve();
        } catch (error) {
          console.error({ error, absence });
          reject();
        }
      }),
  ),
);

clockodo_absences.forEach(async (absence) => {
  const { data } = await awork.post("/absences", {
    userId: users.clockodo_to_awork[absence.users_id],
    startOn: absence.date_since,
    endOn: absence.date_until,
    description:
      categoryMap[absence.type] + (absence.note ? ": " + absence.note : ""),
    isReadOnly: true,
    externalProvider: "clockodo-absences",
    isHalfDayOnStart: absence.count_days % 1 != 0
  });
  console.dir({ data }, { depth: null });
});

// -- non business days

const { data: clockodo_data_nonbusinessdays } = await clockodo.get(
  "/nonbusinessdays",
  {
    params: { year: 2023 },
  },
);
//console.dir({ clockodo_data_nonbusinessdays }, { depth: null });

const { data: awork_data_nonbusinessdays } = await awork.get("/absences", {
  params: {
    filterby: "startswith(externalProvider,'clockodo-nonbusinessdays')",
  },
});
//console.dir({ awork_data_nonbusinessdays, count: awork_data_nonbusinessdays.length }, { depth: null });

await Promise.allSettled(
  awork_data_nonbusinessdays.map(
    (absence) =>
      new Promise(async (resolve, reject) => {
        try {
          await awork.delete("/absences/" + absence.id);
          resolve();
        } catch (error) {
          console.error({ error, absence });
          reject();
        }
      }),
  ),
);

//*
clockodo_data_nonbusinessdays.nonbusinessdays.forEach(
  async (nonbusinessday) => {
    users.matched.forEach(async (user) => {
      const request = {
        userId: user.awork_user_id,
        startOn: nonbusinessday.date,
        endOn: nonbusinessday.date,
        description: "🍾 Feiertag (" + nonbusinessday.name + ")",
        isReadOnly: true,
        externalProvider: "clockodo-nonbusinessdays",
      };

      try {
        const { data } = await awork.post("/absences", request);
        //console.dir({ nonbusinessday, data }, { depth: null });
      } catch (error) {
        console.error({ error: error.response.data, request });
      }
    });
  },
);
//*/
