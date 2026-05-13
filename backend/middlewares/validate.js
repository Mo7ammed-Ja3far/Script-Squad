const { z } = require('zod');

/**
 * Generic Validation Middleware using Zod.
 * Validates req.body, req.query, and req.params against provided Zod schemas.
 * Rejects requests with unexpected fields automatically if strict() is used in the schemas.
 * 
 * @param {z.ZodObject} schema.body - Zod schema for req.body
 * @param {z.ZodObject} schema.query - Zod schema for req.query
 * @param {z.ZodObject} schema.params - Zod schema for req.params
 */
const validate = (schema) => async (req, res, next) => {
  try {
    if (schema.params) {
      // Validate without reassigning
      await schema.params.parseAsync(req.params);
    }
    if (schema.query) {
      // Validate without reassigning
      await schema.query.parseAsync(req.query);
    }
    if (schema.body) {
      // req.body is safe to reassign in Express
      req.body = await schema.body.parseAsync(req.body);
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = validate;