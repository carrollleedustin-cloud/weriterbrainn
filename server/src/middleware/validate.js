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
      res.status(400).json({
        detail: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
  };
}
