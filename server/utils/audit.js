const writeAuditLog = async (db, req, { action, entityType, entityId = null }) => {
    const userId = req.user?.id || null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;

    await db.execute(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [userId, action, entityType, entityId, ipAddress]
    );
};

module.exports = { writeAuditLog };
