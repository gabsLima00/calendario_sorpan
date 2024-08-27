import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, 'secreta');
        req.user = decoded;
        next();
    } catch (error) {
        res.redirect('/login');
    }
}

export default authMiddleware;