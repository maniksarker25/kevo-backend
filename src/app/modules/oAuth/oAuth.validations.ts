import { z } from 'zod';

const oAuthLoginValidationSchema = z.object({
  body: z.object({
    provider: z.string({ required_error: 'Provider is required' }),
    // token: z.string({ required_error: 'Token is required' }),
    // role: z.string({ required_error: 'Role is required' }),
  }),
});

const oAuthValidations = {
  oAuthLoginValidationSchema,
};

export default oAuthValidations;
