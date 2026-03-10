/**
 * Express middleware for Zod validation.
 * Validates req.body or req.query and passes parsed data to req.validated.
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const data = source === "query" ? req.query : req.body;
    const result = schema.safeParse(data);
    if (result.success) {
      req.validated = result.data;
      next();
    } else {
      const fieldErrors = result.error.flatten().fieldErrors;
      const first = Object.entries(fieldErrors)[0];
      const detail = first
        ? `${first[0]}: ${Array.isArray(first[1]) ? first[1][0] : first[1]}`
        : "Validation failed";
      res.status(400).json({
        detail,
        errors: fieldErrors,
      });
    }
  };
}
