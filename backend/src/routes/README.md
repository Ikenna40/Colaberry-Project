# routes

Express route definitions (admin, portal, public). Every route validates request body/query/params with Zod (or equivalent) before business logic runs — malformed input gets a 400, never reaches `../services/`.

Empty for now.
