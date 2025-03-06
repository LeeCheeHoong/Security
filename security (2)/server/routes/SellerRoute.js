const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const db = require('../db')
const DBHelper = require('../db/AuthHelper')

const AttributeMapping = require('../global/attributeMapping')

const authMiddlewareArray = auth.createAttributeMiddleware([AttributeMapping.VERIFIED, AttributeMapping.SELLER])

router.post("/createItem", authMiddlewareArray, async (req, res) => {
    const { username } = req.user;
    const {
        item, description, price
    } = req.body;

    try {
        await db.query('BEGIN');

        const userQuery = await db.query(`
                    SELECT id FROM UserList WHERE username = $1
                `, [username])

        const userId = userQuery.rows[0].id

        const q1 = await db.query(`
            SELECT id FROM seller_detail WHERE user_id=$1
        `, [userId])

        const sellerId = q1.rows[0].id

        await db.query(`
            INSERT INTO public.item_detail
            (item, seller_id, description, price, item_status)
            VALUES($1, $2, $3, $4, $5);
        `,
            [item, sellerId, description, price, '1'])


        await db.query('COMMIT');
        res.status(200).json({ message: "Product posted successfully" })

    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.post("/sellItem", authMiddlewareArray, async (req, res) => {
    const { itemId } = req.body;

    try {
        await db.query('BEGIN');

        // Verify item belongs to seller and update status
        const updateResult = await db.query(`
            UPDATE item_detail 
            SET item_status = '3'
            WHERE id = $1
            RETURNING id
        `, [itemId]);

        if (updateResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: "You don't own this item or item doesn't exist" });
        }

        await db.query('COMMIT');
        res.status(200).json({ message: "Item marked as sold successfully" });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error updating item status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get("/items", authMiddlewareArray, async (req, res) => {
    try {
        // Get seller id from user_id
        const { username } = req.user;

        const userQuery = await db.query(`
                    SELECT id FROM UserList WHERE username = $1
                `, [username])

        const userId = userQuery.rows[0].id

        const q1 = await db.query(`
            SELECT id FROM seller_detail WHERE user_id = $1
        `, [userId]);

        const sellerId = q1.rows[0].id;

        // Get all items for this seller
        const items = await db.query(`
            SELECT id, item, description, price, item_status
            FROM item_detail 
            WHERE seller_id = $1
            ORDER BY id DESC
        `, [sellerId]);

        res.status(200).json(items.rows);

    } catch (error) {
        console.error('Error fetching seller items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post("/denySale", authMiddlewareArray, async (req, res) => {
    try {
        await db.query('BEGIN');

        const { itemId } = req.body;
        const { username } = req.user;

        // Get seller id from user_id
        const userQuery = await db.query(`
            SELECT id FROM UserList WHERE username = $1
        `, [username]);

        const userId = userQuery.rows[0].id;

        const sellerQuery = await db.query(`
            SELECT id FROM seller_detail WHERE user_id = $1
        `, [userId]);

        const sellerId = sellerQuery.rows[0].id;

        // Update item status back to available (1) if the seller owns it and it's currently reserved (2)
        const updateResult = await db.query(`
            UPDATE item_detail 
            SET item_status = 1
            WHERE id = $1 
            AND seller_id = $2
            AND item_status = 2
            RETURNING *
        `, [itemId, sellerId]);

        if (updateResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: "You don't own this item, item doesn't exist, or item is not in reserved status" });
        }

        await db.query('COMMIT');
        res.status(200).json({ message: "Sale denied successfully" });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error denying sale:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




module.exports = router;
