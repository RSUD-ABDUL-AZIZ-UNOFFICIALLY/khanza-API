const path = require('path');
module.exports = {
    async pxDPJP(req, res) {
        try {
            res.sendFile(path.join(__dirname, './../views', 'dpjp.html'));

        } catch (err) {
            return res.status(400).json({
                status: false,
                message: err.message,
                data: null
            });
        }
    }
};