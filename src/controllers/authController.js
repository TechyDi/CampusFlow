const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const authValidator = require('../validators/auth.validator');
const AppError = require('../utils/AppError');

const loginUser = asyncHandler(async (req, res, next) => {
    const { error } = authValidator.login.validate(req.body);
    if (error) {
        return next(new AppError(400, error.details[0].message));
    }

    const { email, password } = req.body;
    const { token, role } = await AuthService.loginUser(email, password);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 12 * 60 * 60 * 1000 // 12 hours
    });

    res.status(200).json(new ApiResponse(200, { role }, 'Logged in successfully'));
});

const logoutUser = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};

const getSignupPage = asyncHandler(async (req, res) => {
    const institutions = await AuthService.getSignupData();
    res.render('signup', { institutions });
});

const registerUser = asyncHandler(async (req, res, next) => {
    const { error } = authValidator.register.validate(req.body);
    if (error) {
        return next(new AppError(400, error.details[0].message));
    }

    const { name, email, password, institutionId } = req.body;
    
    await AuthService.registerUser(name, email, password, institutionId);

    res.status(201).json(new ApiResponse(201, null, 'Registration successful! Please wait for Admin approval.'));
});

module.exports = { loginUser, logoutUser, getSignupPage, registerUser };
