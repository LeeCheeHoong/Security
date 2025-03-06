const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const db = require('../db')
const DBHelper = require('../db/AuthHelper')

const AttributeMapping = require('../global/attributeMapping')

const authMiddlewareArray = auth.createAttributeMiddleware([AttributeMapping.ADMIN])

router.post('/createAdmin', authMiddlewareArray, async (req, res) => {
    const { username, password } = req.body;

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
        const attributeResult = await db.query(
            'SELECT id FROM Attribute WHERE attribute = $1',
            [AttributeMapping.ADMIN]
        );

        const attributeId = attributeResult.rows[0].id;

        // Insert the new user into the UserList table with empty name and attributeId
        await db.query(
            'INSERT INTO UserList (username, attribute_id) VALUES ($1, $2)',
            [username, [attributeId]]
        );

        // Commit transaction
        await db.query('COMMIT');

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.post("/approveSeller", authMiddlewareArray, async (req, res) => {
    const { sellerName } = req.body

    try {
        const sellerAttributeId = await DBHelper.getAttributeId([AttributeMapping.SELLER])
        const prevAttributeId = (await DBHelper.getAttributeId([AttributeMapping.PENDING_SELLER]))[0]

        await db.query('BEGIN');

        await db.query(`
            UPDATE UserList
            SET attribute_id =
            CASE 
                WHEN NOT (attribute_id && $1) THEN array_cat(attribute_id, $1)
                ELSE attribute_id
            END
            WHERE username = $2;`,
            [sellerAttributeId, sellerName]
        )

        await db.query(`
            UPDATE UserList
            SET attribute_id = array_remove(attribute_id, $1)
            WHERE username = $2;`,
            [prevAttributeId, sellerName]
        )

        const userQuery = await db.query(`
            SELECT id FROM UserList WHERE username = $1
        `, [sellerName])

        const sellerId = userQuery.rows[0].id

        await db.query(`
            INSERT INTO public.seller_detail
            (user_id,name)
            VALUES($1,$2);`,
            [sellerId, sellerName]
        )


        await db.query('COMMIT');

        res.status(200).json({ message: 'Seller approved' });

    } catch (error) {
        console.error('Error registering:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get('/listUser', authMiddlewareArray, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.username, 
                COALESCE(json_agg(a.attribute) FILTER (WHERE a.attribute IS NOT NULL), '[]') AS attributes
            FROM userlist u
            LEFT JOIN LATERAL unnest(u.attribute_id) AS attr_id ON TRUE
            LEFT JOIN attribute a ON a.id = attr_id
            GROUP BY u.username;
            `
        )
        const users = result.rows

        res.status(200).json({ message: 'Get success', data: users });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get('/listSeller', authMiddlewareArray, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.username, 
                COALESCE(json_agg(a.attribute) FILTER (WHERE a.attribute IS NOT NULL), '[]') AS attributes
            FROM userlist u
            LEFT JOIN LATERAL unnest(u.attribute_id) AS attr_id ON TRUE
            LEFT JOIN attribute a ON a.id = attr_id
            WHERE a.attribute = 'SELLER'
            GROUP BY u.username;
            `
        )
        const users = result.rows

        res.status(200).json({ message: 'Get success', data: users });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.post('/removeSellerRights', authMiddlewareArray, async (req, res) => {
    const { sellerName } = req.body

    try {
        const sellerAttributeId = (await DBHelper.getAttributeId([AttributeMapping.SELLER]))[0]

        await db.query(`
            UPDATE UserList
            SET attribute_id = array_remove(attribute_id, $1)
            WHERE username = $2;`,
            [sellerAttributeId, sellerName]
        )

        res.status(200).json({ message: 'Seller rights removed' });

    } catch (error) {
        console.error('Error registering:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})



module.exports = router;
