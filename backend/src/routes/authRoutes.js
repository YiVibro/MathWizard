const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const todaysPrice=require('../middlewares/todaysPrice');

const router = express.Router();

router.post('/register',registerUser);
router.post('/login', loginUser);
//router.post('/sell',sell);
router.route('/price',(req,res)=>{console.log("Came till here")},todaysPrice);

module.exports = router;
