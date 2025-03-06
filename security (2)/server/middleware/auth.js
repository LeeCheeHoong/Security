const jwt = require('jsonwebtoken');
const db = require('../db')
require('dotenv').config();
const DBHelper = require('../db/AuthHelper')

const secretKey = process.env.LOGIN_SECRET; // Use an environment variable for production

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }

        // Save decoded token in request for use in other routes
        req.user = decoded;
        next();
    });
};

const checkAttributeMiddleware = (requiredAttributes) => {
    return async (req, res, next) => {
        try {
            const username = req.user.username

            // Get all attribute IDs for required attributes
            const requiredAttributeIds = await DBHelper.getAttributeId([requiredAttributes])

            if (requiredAttributeIds.length !== requiredAttributes.length) {
                return res.status(400).json({ message: 'Invalid attributes specified' });
            }

            // Query to see if all required attribute IDs exist for the user
            const result = await db.query(
                `
                SELECT COUNT(DISTINCT attribute_id) AS user_attribute_count
                FROM UserList
                where username = $1
                GROUP BY id
                HAVING $2 <@ ARRAY_AGG(attribute_id)
                `,
                [username, requiredAttributeIds]
            );

            const isEligible = result.rows.length === 1

            if (isEligible) {
                next(); // User is eligible, proceed to the next middleware or route handler
            } else {
                res.status(403).json({ message: 'User is not eligible for this action' });
            }
        } catch (error) {
            console.error('Error checking attribute:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

const createAttributeMiddleware = (requiredAttributes) => {
    return [
        authMiddleware,
        checkAttributeMiddleware([...requiredAttributes])
    ]
}

const reverseAttributeMiddleware = (reverseAttributes) => {
    return async (req, res, next) => {
        try {
            const username = req.user.username

            const requiredAttributeIds = await DBHelper.getAttributeId([reverseAttributes])

            if (requiredAttributeIds.length !== reverseAttributes.length) {
                return res.status(400).json({ message: 'Invalid attributes specified' });
            }

            const result = await db.query(
                `
                SELECT COUNT(DISTINCT attribute_id) AS user_attribute_count
                FROM UserList
                where username = $1
                GROUP BY id
                HAVING $2 <@ ARRAY_AGG(attribute_id)
                `,
                [username, requiredAttributeIds]
            );

            const isNonEligible = result.rows.length === 1

            if (isNonEligible) {
                res.status(403).json({ message: 'User is not eligible for this action' });
            } else {
                next();
            }
        } catch (error) {
            console.error('Error checking attribute:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = { createAttributeMiddleware, reverseAttributeMiddleware, authMiddleware }
