const db = require('../db')

const getAttributeId = async (attribute) => {
    try {
        const getAttributeId = await db.query(
            `SELECT id FROM Attribute WHERE attribute = ANY($1::text[])`,
            [attribute]
        );


        const requiredAttributeIds = getAttributeId.rows.map(row => row.id);

        return requiredAttributeIds
    } catch (e) {
        console.error('Error getting attribute:', e);
    }
}

module.exports = {
    getAttributeId
}