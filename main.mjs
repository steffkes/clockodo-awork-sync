import logger from "./src/logger.mjs";
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

logger.info("Fetched clockodo users", {
  count: clockodo_users.users.length,
});
logger.info("Fetched awork users", {
  count: awork_users.length,
});

const users = match({
  clockodo: clockodo_users,
  awork: awork_users,
});

logger.info("Matched users", {
  count: users.matched.length,
});

// -- absences

const categoryMap = {
  1: "🏖️ Urlaub",
  3: "🏖️ Urlaub",

  2: "🙅 Sonstige",
  10: "🙅 Sonstige",
  6: "🙅 Sonstige",
  14: "🙅 Sonstige",
  7: "🙅 Sonstige",
  13: "🙅 Sonstige",

  4: "🤒 Krank",
  15: "🤒 Krank",
  11: "🤒 Krank",
  5: "🤒 Krank",
  12: "🤒 Krank",
};

const { data: clockodo_data_absences } = await clockodo.get("/absences", {
  params: { year: 2024 },
});

logger.info("Fetched clockodo absences", {
  count: clockodo_data_absences.absences.length,
});

const clockodo_absences = clockodo_data_absences.absences
  .filter(({ users_id: userId }) => userId in users.clockodo_to_awork)
  .filter(({ type }) => type in categoryMap)
  .filter(({ status }) => status == 1); // status=1 is approved

logger.info("Filtered clockodo absences", {
  count: clockodo_absences.length,
});

const { data: awork_data_absences } = await awork.get("/absences", {
  params: {
    filterby: "startswith(externalProvider,'clockodo-absences')",
  },
});
logger.info("Fetched awork absences", {
  count: awork_data_absences.length,
});

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
logger.info("Cleared awork absences");

clockodo_absences.forEach(async (absence) => {
  const entity = {
    userId: users.clockodo_to_awork[absence.users_id],
    startOn: absence.date_since,
    endOn: absence.date_until,
    description:
      categoryMap[absence.type] + (absence.note ? ": " + absence.note : ""),
    isReadOnly: true,
    externalProvider: "clockodo-absences",
    isHalfDayOnStart: absence.count_days % 1 != 0,
  };
  try {
    const { data } = await awork.post("/absences", entity);
    logger.debug("Created awork absences", entity);
  } catch (error) {
    logger.error("Failed to create awork absence", {
      error: error.response.data,
      entity,
    });
  }
});
logger.info("Created awork absences", { count: clockodo_absences.length });

// -- non business days

const { data: clockodo_data_nonbusinessdays } = await clockodo.get(
  "/nonbusinessdays",
  {
    params: { year: 2024 },
  },
);
logger.info("Fetched clockodo non-business-days", {
  count: clockodo_data_nonbusinessdays.nonbusinessdays.length,
});

const { data: awork_data_nonbusinessdays } = await awork.get("/absences", {
  params: {
    filterby: "startswith(externalProvider,'clockodo-nonbusinessdays')",
  },
});
logger.info("Fetched awork non-business-days", {
  count: awork_data_nonbusinessdays.length,
});

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
logger.info("Cleared awork non-business-days");

clockodo_data_nonbusinessdays.nonbusinessdays.forEach(
  async (nonbusinessday) => {
    users.matched.forEach(async (user) => {
      const entity = {
        userId: user.awork_user_id,
        startOn: nonbusinessday.date,
        endOn: nonbusinessday.date,
        description: "🍾 Feiertag (" + nonbusinessday.name + ")",
        isReadOnly: true,
        externalProvider: "clockodo-nonbusinessdays",
      };

      try {
        const { data } = await awork.post("/absences", entity);
        logger.debug("Created awork non-business-day", entity);
      } catch (error) {
        logger.error("Failed to create awork non-business-day", {
          error: error.response.data,
          entity,
        });
      }
    });
  },
);
logger.info("Created awork non-business-days", {
  count:
    clockodo_data_nonbusinessdays.nonbusinessdays.length * users.matched.length,
});
