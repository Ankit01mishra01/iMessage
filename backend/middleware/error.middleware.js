export const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
    });
};

export const notFoundHandler = (req, res) => {
    res.status(404).json({ error: 'Route not found' });
};
