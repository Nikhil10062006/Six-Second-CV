export const asyncHandler = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};
