const express = require('express');
const router = express.Router();
const db = require('../db')
const bcrypt = require('bcrypt');
const fs = require('fs')

const auth = require('../middleware/auth');
const AttributeMapping = require('../global/attributeMapping');
const DBHelper = require('../db/AuthHelper')

const authMiddlewareArray_unverified = auth.createAttributeMiddleware([AttributeMapping.BUYER]);
const authMiddlewareArray_verified = auth.createAttributeMiddleware([AttributeMapping.BUYER, AttributeMapping.VERIFIED]);

router.post("/startVerify",
    ...authMiddlewareArray_unverified,
    auth.reverseAttributeMiddleware([AttributeMapping.VERIFIED]),
    async (req, res) => {
        const { username } = req.user;

        try {
            // Generate a 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Mock OTP system
            fs.writeFileSync("./otp.txt", otp);

            // Hash the OTP
            const hashedOtp = await bcrypt.hash(otp, 10);

            // Set expired date 5 minutes later
            const expirationDate = (() => {
                const date = new Date()
                date.setMinutes(date.getMinutes() + 5)
                return date
            })()

            await db.query(`
            UPDATE UserLogin
            SET verification_token=$1, token_expiry=$2
            WHERE username = $3`,
                [hashedOtp, expirationDate, username]
            )

            res.status(200).json({ message: 'OTP Code sent' });

        } catch (error) {
            console.error('Error verifying user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })

router.post("/verifyAccount",
    ...authMiddlewareArray_unverified,
    auth.reverseAttributeMiddleware([AttributeMapping.VERIFIED]),
    async (req, res) => {
        const { username } = req.user;
        const { otp } = req.body;

        try {
            // Find the user by email
            const result = await db.query(
                `SELECT 
            username, verification_token, token_expiry 
            FROM UserLogin WHERE username = $1`,
                [username]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid email address' });
            }

            const hashedOtp = result.rows[0].verification_token;
            const expirationDate = result.rows[0].token_expiry;

            // Compare the provided OTP with the stored hashed OTP
            const isValidOtp = await bcrypt.compare(otp, hashedOtp);

            if (!isValidOtp) {
                return res.status(400).json({ message: 'Invalid OTP' });
            }

            if (new Date(expirationDate) < new Date()) {
                return res.status(400).json({ message: 'Token Expired' });
            }

            const attributeId = await DBHelper.getAttributeId([AttributeMapping.VERIFIED])

            await db.query(`
            UPDATE UserList
            SET attribute_id =
            CASE 
                WHEN NOT (attribute_id && $1) THEN array_cat(attribute_id, $1)
                ELSE attribute_id
            END
            WHERE username = $2`,
                [attributeId, username]
            )

            res.status(200).json({ message: 'User verified successfully' });

        } catch (error) {
            console.error('Error verifying user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })

router.post("/registerAsSeller",
    ...authMiddlewareArray_verified,
    auth.reverseAttributeMiddleware([AttributeMapping.SELLER]),
    async (req, res) => {
        const { username } = req.user;

        try {
            const attributeId = await DBHelper.getAttributeId([AttributeMapping.PENDING_SELLER])

            await db.query(`
            UPDATE UserList
            SET attribute_id =
            CASE 
                WHEN NOT (attribute_id && $1) THEN array_cat(attribute_id, $1)
                ELSE attribute_id
            END
            WHERE username = $2`,
                [attributeId, username]
            )

            res.status(200).json({ message: 'Regsiter Request Sent' });

        } catch (error) {
            console.error('Error registering:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })

router.post("/buyItem",
    ...authMiddlewareArray_verified,
    async (req, res) => {
        const { itemId } = req.body;
        const { username } = req.user;

        try {
            const buyerResult = await db.query(
                'SELECT id FROM UserList WHERE username = $1',
                [username]
            );

            if (buyerResult.rows.length === 0) {
                return res.status(404).json({ message: 'Buyer not found' });
            }

            const buyerId = buyerResult.rows[0].id;


            await db.query(`
            UPDATE item_detail 
            SET item_status = 2,
                buyer_id = $1
            WHERE id = $2`,
                [buyerId, itemId]
            )

            res.status(200).json({ message: 'Item purchase request sent' });

        } catch (error) {
            console.error('Error purchasing item:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })

router.get("/list",
    ...authMiddlewareArray_unverified,
    async (req, res) => {
        try {
            const result = await db.query(`
                SELECT 
                    id,
                    item,
                    description,
                    price,
                    item_status,
                    seller_id
                FROM item_detail
                ORDER BY id DESC`
            );

            res.status(200).json(result.rows);

        } catch (error) {
            console.error('Error fetching items:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })

router.get("/getSellerId", auth.authMiddleware, async (req, res) => {
    const { username } = req.user;

    try {
        const result = await db.query(`
            SELECT id 
            FROM UserList 
            WHERE username = $1`,
            [username]
        );

        const userid = await result.rows[0].id

        const result2 = await db.query(`
            SELECT id
            FROM seller_detail
            WHERE user_id = $1`,
            [userid]
        )

        if (result2.rows.length === 0) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        res.status(200).json({ sellerId: result2.rows[0].id });

    } catch (error) {
        console.error('Error fetching seller ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

module.exports = router;