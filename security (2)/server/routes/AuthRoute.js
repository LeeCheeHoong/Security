const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db')
require('dotenv').config();
const DBHelper = require('../db/AuthHelper')

const jwt = require('jsonwebtoken');
const AttributeMapping = require('../global/attributeMapping');

const auth = require('../middleware/auth');

const secretKey = process.env.LOGIN_SECRET; // Use an environment variable for production

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Begin a transaction
        await db.query('BEGIN');

        // Insert the new user into the UserLogin table
        await db.query(
            'INSERT INTO UserLogin (username, password) VALUES ($1, $2)',
            [username, hashedPassword]
        );

        // Retrieve the id from the Attribute table where attribute is 'unverified'
        const newUserResult = await db.query(
            'SELECT id FROM Attribute WHERE attribute = $1',
            [AttributeMapping.NEW_USER]
        );
        const buyerResult = await db.query(
            'SELECT id FROM Attribute WHERE attribute = $1',
            [AttributeMapping.BUYER]
        );

        const newUserId = newUserResult.rows[0].id;
        const buyerId = buyerResult.rows[0].id;

        const attributeIds = [newUserId, buyerId];

        // Insert the new user into the UserList table with empty name and attributeId
        await db.query(
            'INSERT INTO UserList (username, attribute_id) VALUES ($1, $2)',
            [username, [...attributeIds]]
        );

        // Commit transaction
        await db.query('COMMIT');

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const result = await db.query('SELECT * FROM UserLogin WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate the JWT token
        const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/checkPermission', auth.authMiddleware, async (req, res) => {
    const { roleRequired } = req.body
    const { username } = req.user

    try {
        let attribute;
        switch (roleRequired) {
            case "admin":
                attribute = AttributeMapping.ADMIN
                break
            case "buyer":
                attribute = AttributeMapping.BUYER
                break
            case "seller":
                attribute = AttributeMapping.SELLER
                break
        }

        const attributeId = await DBHelper.getAttributeId([attribute])
        if (attributeId.length === 0) {
            throw new Error('Invalid attribute - no matching attribute ID found')
        }
        const result = await db.query(
            `
                SELECT *
                FROM UserList
                where username = $1
                GROUP BY id
                HAVING $2 <@ ARRAY_AGG(attribute_id)
                `,
            [username, [attributeId]]
        );


        const isEligible = result.rows.length === 1

        if (!isEligible) {
            return res.status(403).json({ message: "User is not permitted" })
        }
        res.status(200).json({ message: "User is permitted" })

    } catch (e) {
        console.error('Error:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.post('/checkAttribute', auth.authMiddleware, async (req, res) => {
    const { attribute } = req.body
    const { username } = req.user

    try {
        const attributeId = await DBHelper.getAttributeId([attribute])

        const result = await db.query(
            `
                SELECT COUNT(DISTINCT attribute_id) AS user_attribute_count
                FROM UserList
                where username = $1
                GROUP BY id
                HAVING $2 <@ ARRAY_AGG(attribute_id)
                `,
            [username, [attributeId]]
        );

        const isEligible = result.rows.length === 1
        if (!isEligible) {
            return res.status(403).json({ message: "User is not permitted" })
        }
        res.status(200).json({ message: "User is permitted" })

    } catch (e) {
        console.error('Error:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get('/getUserAttributes', auth.authMiddleware, async (req, res) => {
    const { username } = req.user;

    try {
        const result = await db.query(`
            SELECT a.attribute
            FROM UserList ul
            JOIN Attribute a ON a.id = ANY(ul.attribute_id)
            WHERE ul.username = $1
        `, [username]);

        // Only return specific allowed attributes that are relevant for frontend access control
        const filteredAttributes = result.rows
            .map(row => row.attribute)

        res.status(200).json({ attributes: filteredAttributes });

    } catch (error) {
        console.error('Error fetching user attributes:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router