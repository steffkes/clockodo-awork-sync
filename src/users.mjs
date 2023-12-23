import Ajv from "ajv";

const schema = {
  clockodo: {
    type: "object",
    required: ["users"],
    properties: {
      users: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "email"],
          properties: {
            id: { type: "integer" },
            email: { type: "string" },
          },
        },
      },
    },
  },
  awork: {
    type: "array",
    items: {
      type: "object",
      required: ["id", "userContactInfos"],
      properties: {
        id: { type: "string" },
        userContactInfos: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "value"],
            properties: {
              type: { enum: ["social", "email", "phone"] },
              value: { type: "string" },
            },
          },
        },
      },
    },
  },
};

const ajv = new Ajv({ allErrors: true });
const validator = {
  clockodo: ajv.compile(schema.clockodo),
  awork: ajv.compile(schema.awork),
};

// --

const validate = (data) => {
  const valid = validator(data);
  return { valid, errors: validator.errors ?? [] };
};

const match = ({ clockodo, awork }) => {
  const valid = {
    clockodo: validator.clockodo(clockodo),
    awork: validator.awork(awork),
  };
  console.dir(
    {
      valid,
      errors: {
        clockodo: validator.clockodo.errors,
        awork: validator.awork.errors,
      },
    },
    { depth: null },
  );

  const aworkMap = Object.fromEntries(
    awork.flatMap(({ id, userContactInfos }) =>
      userContactInfos.map(({ value }) => [value, id]),
    ),
  );

  const matched = clockodo.users
    .map(({ id: clockodo_user_id, email }) => ({
      email,
      clockodo_user_id,
      awork_user_id: aworkMap[email],
    }))
    .filter(({ awork_user_id }) => awork_user_id);

  const mapper = matched.reduce(
    (state, user) => {
      state.clockodo_to_awork[user.clockodo_user_id] = user.awork_user_id;
      state.awork_to_clockodo[user.awork_user_id] = user.clockodo_user_id;
      return state;
    },
    { clockodo_to_awork: {}, awork_to_clockodo: {} },
  );

  return {
    matched,
    ...mapper,
  };
};

export { match };
