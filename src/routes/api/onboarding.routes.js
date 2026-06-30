const express = require('express');
const router = express.Router();
const { registerInstitution } = require('../../controllers/onboardingController');

router.post('/api/onboarding/register-institution', registerInstitution);

module.exports = router;