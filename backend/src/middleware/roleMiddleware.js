module.exports = (allowedRoles) => {
    return (req, res, next) => {
        // req.user được tạo ra từ authMiddleware trước đó
        if (!req.user || !allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ 
                message: "Quyền truy cập bị từ chối: Bạn không có đủ thẩm quyền thực hiện hành động này." 
            });
        }
        next();
    };
};