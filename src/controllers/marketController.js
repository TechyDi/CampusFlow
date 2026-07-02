const MarketplaceService = require('../services/marketplace.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const marketplaceValidator = require('../validators/marketplace.validator');
const AppError = require('../utils/AppError');

const createListing = asyncHandler(async (req, res, next) => {
    const { error } = marketplaceValidator.listing.validate(req.body);
    if (error) {
        return next(new AppError(400, error.details[0].message));
    }

    const institutionId = req.user.institutionId;
    const studentId = req.user.id;

    const newItem = await MarketplaceService.createListing(institutionId, studentId, req.body, req.files);
    res.status(201).json(new ApiResponse(201, { item: newItem }, 'Listing created successfully'));
});

const markAsSold = asyncHandler(async (req, res) => {
    await MarketplaceService.markAsSold(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse(200, null, 'Item marked as sold and buyer recorded'));
});

const editListing = asyncHandler(async (req, res, next) => {
    const { error } = marketplaceValidator.listing.validate(req.body);
    if (error) {
        return next(new AppError(400, error.details[0].message));
    }

    const updatedItem = await MarketplaceService.editListing(req.params.id, req.user.id, req.body, req.files);
    res.status(200).json(new ApiResponse(200, { item: updatedItem }, 'Listing updated successfully'));
});

const deleteListing = asyncHandler(async (req, res) => {
    await MarketplaceService.deleteListing(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse(200, null, 'Item deleted'));
});

const buyItem = asyncHandler(async (req, res) => {
    const sellerContact = await MarketplaceService.buyItem(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse(200, { sellerContact }, 'You have successfully claimed this item!'));
});

const messageSeller = asyncHandler(async (req, res, next) => {
    const { error } = marketplaceValidator.message.validate(req.body);
    if (error) {
        return next(new AppError(400, error.details[0].message));
    }

    await MarketplaceService.messageSeller(req.params.id, req.user.id, req.body.message);
    res.status(200).json(new ApiResponse(200, null, 'Message sent'));
});

module.exports = { createListing, markAsSold, buyItem, editListing, deleteListing, messageSeller };