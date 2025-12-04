const { callEklaim } = require('../helpers/api');
module.exports = {
    ws: async (req, res) => {
        try{
            const body = req.body;
            const data = await callEklaim(body);
          
            return res.status(200).json({
                status: true,
                message: 'Data inacbg',
                data: data
            }
            );
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
    }
}