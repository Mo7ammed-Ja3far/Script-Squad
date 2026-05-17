const successResponse = (data, message = 'Success', meta = null) => {
  const res = { success: true, message };
  if (data !== null && data !== undefined) res.data = data;
  if (meta) res.meta = meta;
  return res;
};

const errorResponse = (message = 'An unexpected error occurred.', errors = null) => {
  const res = { success: false, message };
  if (errors) res.errors = errors;
  return res;
};

const paginatedResponse = (data, message, page, limit, total) => {
  return successResponse(data, message, {
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    }
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
