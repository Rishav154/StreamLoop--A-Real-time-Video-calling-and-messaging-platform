import express from "express";
import {protectRoute} from "../middlewares/auth.middleware.js";
import {
    getMyFriends,
    getRecommendedUsers,
    sendFriendRequest,
    acceptFriendRequest,
    getFriendRequest, getOutgoingFriendReqs
} from "../controllers/user.controller.js";
const router = express.Router();

router.use(protectRoute);
router.get("/", getRecommendedUsers)
router.get("/friends", getMyFriends)

router.post("/friend-request/:id", sendFriendRequest);
router.post("/friend-request/:id/accept", acceptFriendRequest);

router.get("/friend-request", getFriendRequest);
router.get("/outgoing-friend-request", getOutgoingFriendReqs)

export default router;